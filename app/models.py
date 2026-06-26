"""
Pydantic schemas for request and response models.
"""
from pydantic import ConfigDict
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime


class ClassifyRequest(BaseModel):
    """Request schema for single message classification."""
    message: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="The SMS message text to classify",
        examples=["Congratulations! You've won a FREE prize. Call now!"]
    )


class ClassifyResponse(BaseModel):
    """Response schema for a single classification result."""
    message: str = Field(description="The original message text")
    label: str = Field(description="Classification label: 'spam' or 'ham'")
    confidence: float = Field(description="Model confidence score (0.0 to 1.0)")
    processing_time_ms: float = Field(description="Time taken to classify in milliseconds")
    timestamp: datetime = Field(description="UTC timestamp of classification")


class BatchClassifyRequest(BaseModel):
    """Request schema for batch message classification."""
    messages: List[str] = Field(
        ...,
        min_length=1,
        max_length=100,
        description="List of SMS messages to classify (max 100)",
        examples=[["Win a FREE iPhone!", "Hey, are you coming to dinner tonight?"]]
    )


class BatchClassifyResponse(BaseModel):
    """Response schema for batch classification results."""
    results: List[ClassifyResponse]
    total: int = Field(description="Total number of messages classified")
    spam_count: int = Field(description="Number of messages classified as spam")
    ham_count: int = Field(description="Number of messages classified as ham")
    total_processing_time_ms: float = Field(description="Total processing time in milliseconds")


class HealthResponse(BaseModel):
    """Response schema for the health check endpoint."""
    status: str = Field(description="Service status: 'healthy' or 'degraded'")
    model_loaded: bool = Field(description="Whether the ML model is loaded")
    vectorizer_loaded: bool = Field(description="Whether the TF-IDF vectorizer is loaded")
    model_type: str = Field(description="Type of ML model in use")


class StatsResponse(BaseModel):
    """Response schema for session statistics."""
    model_config = ConfigDict(protected_namespaces=())

    total_classified: int
    spam_count: int
    ham_count: int
    spam_percentage: float
    ham_percentage: float
    model_accuracy: float
    model_type: str
    dataset_size: int
    feature_count: int
