"""
Model loading and prediction logic.
Handles loading the trained Naive Bayes model and TF-IDF vectorizer,
and provides prediction utilities used by the API routers.
"""
import os
import time
import logging
import joblib
import numpy as np
from pathlib import Path
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Resolve models directory relative to this file's location
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"

MODEL_PATH = MODELS_DIR / "spam_classifier_model.pkl"
VECTORIZER_PATH = MODELS_DIR / "tfidf_vectorizer.pkl"

# Global model and vectorizer instances
_model = None
_vectorizer = None

# Session statistics (in-memory)
_session_stats = {
    "total_classified": 0,
    "spam_count": 0,
    "ham_count": 0,
}


def load_models():
    """Load the Naive Bayes model and TF-IDF vectorizer from disk."""
    global _model, _vectorizer

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model file not found at {MODEL_PATH}. "
            "Please ensure 'spam_classifier_model.pkl' is in the 'models/' directory."
        )
    if not VECTORIZER_PATH.exists():
        raise FileNotFoundError(
            f"Vectorizer file not found at {VECTORIZER_PATH}. "
            "Please ensure 'tfidf_vectorizer.pkl' is in the 'models/' directory."
        )

    logger.info("Loading Naive Bayes model from %s", MODEL_PATH)
    _model = joblib.load(MODEL_PATH)

    logger.info("Loading TF-IDF vectorizer from %s", VECTORIZER_PATH)
    _vectorizer = joblib.load(VECTORIZER_PATH)

    logger.info("Models loaded successfully.")


def is_model_loaded() -> bool:
    """Return True if the ML model is loaded."""
    return _model is not None


def is_vectorizer_loaded() -> bool:
    """Return True if the TF-IDF vectorizer is loaded."""
    return _vectorizer is not None


def predict(message: str) -> dict:
    """
    Classify a single SMS message.

    Args:
        message: Raw SMS text to classify.

    Returns:
        A dict with keys: label, confidence, processing_time_ms, timestamp.
    """
    if _model is None or _vectorizer is None:
        raise RuntimeError("Models are not loaded. Call load_models() first.")

    start = time.perf_counter()

    # Vectorize the input message
    features = _vectorizer.transform([message])

    # Get prediction and probability
    prediction = _model.predict(features)[0]
    probabilities = _model.predict_proba(features)[0]

    # Class 1 = spam, class 0 = ham
    confidence = float(np.max(probabilities))
    label = "spam" if prediction == 1 else "ham"

    elapsed_ms = (time.perf_counter() - start) * 1000

    # Update session stats
    _session_stats["total_classified"] += 1
    if label == "spam":
        _session_stats["spam_count"] += 1
    else:
        _session_stats["ham_count"] += 1

    return {
        "label": label,
        "confidence": round(confidence, 4),
        "processing_time_ms": round(elapsed_ms, 3),
        "timestamp": datetime.now(timezone.utc),
    }


def get_session_stats() -> dict:
    """Return current session classification statistics."""
    total = _session_stats["total_classified"]
    spam = _session_stats["spam_count"]
    ham = _session_stats["ham_count"]
    return {
        "total_classified": total,
        "spam_count": spam,
        "ham_count": ham,
        "spam_percentage": round((spam / total * 100) if total > 0 else 0.0, 2),
        "ham_percentage": round((ham / total * 100) if total > 0 else 0.0, 2),
        # Static model metadata
        "model_accuracy": 97.22,
        "model_type": "Multinomial Naive Bayes",
        "dataset_size": 5572,
        "feature_count": 5000,
    }
