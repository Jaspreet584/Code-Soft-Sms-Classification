"""
Classification router — handles single and batch SMS classification endpoints.
"""
import time
from typing import List
from fastapi import APIRouter, HTTPException

from app.models import (
    ClassifyRequest,
    ClassifyResponse,
    BatchClassifyRequest,
    BatchClassifyResponse,
)
from app import predictor

router = APIRouter(prefix="/classify", tags=["Classification"])


@router.post(
    "",
    response_model=ClassifyResponse,
    summary="Classify a single SMS message",
    description=(
        "Submit one SMS message and receive a spam/ham label along with "
        "the model's confidence score and processing time."
    ),
)
async def classify_single(request: ClassifyRequest) -> ClassifyResponse:
    """Classify a single SMS message as spam or ham."""
    if not predictor.is_model_loaded():
        raise HTTPException(status_code=503, detail="Model is not loaded. Please try again later.")

    result = predictor.predict(request.message)

    return ClassifyResponse(
        message=request.message,
        label=result["label"],
        confidence=result["confidence"],
        processing_time_ms=result["processing_time_ms"],
        timestamp=result["timestamp"],
    )


@router.post(
    "/batch",
    response_model=BatchClassifyResponse,
    summary="Classify multiple SMS messages",
    description=(
        "Submit up to 100 SMS messages at once and receive classification "
        "results for each, along with aggregate spam/ham statistics."
    ),
)
async def classify_batch(request: BatchClassifyRequest) -> BatchClassifyResponse:
    """Classify a batch of SMS messages."""
    if not predictor.is_model_loaded():
        raise HTTPException(status_code=503, detail="Model is not loaded. Please try again later.")

    if len(request.messages) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 messages per batch request.")

    start_total = time.perf_counter()
    results: List[ClassifyResponse] = []

    for message in request.messages:
        if not message.strip():
            continue
        result = predictor.predict(message)
        results.append(
            ClassifyResponse(
                message=message,
                label=result["label"],
                confidence=result["confidence"],
                processing_time_ms=result["processing_time_ms"],
                timestamp=result["timestamp"],
            )
        )

    total_ms = round((time.perf_counter() - start_total) * 1000, 3)
    spam_count = sum(1 for r in results if r.label == "spam")
    ham_count = sum(1 for r in results if r.label == "ham")

    return BatchClassifyResponse(
        results=results,
        total=len(results),
        spam_count=spam_count,
        ham_count=ham_count,
        total_processing_time_ms=total_ms,
    )
