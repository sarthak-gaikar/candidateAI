"""
Embedding generation and semantic similarity using Sentence Transformers.

Provides:
- Resume embedding generation
- Cosine similarity for candidate comparison
- Similar candidate discovery
"""

import logging
import numpy as np
from functools import lru_cache

from app.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _load_model():
    """Lazy-load the sentence transformer model (cached singleton)."""
    try:
        from sentence_transformers import SentenceTransformer
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        model = SentenceTransformer(settings.EMBEDDING_MODEL)
        logger.info("Embedding model loaded successfully")
        return model
    except Exception as e:
        logger.error(f"Failed to load embedding model: {e}")
        return None


def generate_embedding(text: str) -> list[float] | None:
    """
    Generate a sentence embedding for the given text.

    Returns:
        List of floats representing the embedding vector, or None if model unavailable.
    """
    model = _load_model()
    if model is None:
        return None

    try:
        # Truncate text to model's max sequence length
        max_chars = 5000
        if len(text) > max_chars:
            text = text[:max_chars]

        embedding = model.encode(text, normalize_embeddings=True)
        return embedding.tolist()
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        return None


def cosine_similarity(embedding1: list[float], embedding2: list[float]) -> float:
    """Compute cosine similarity between two embedding vectors."""
    a = np.array(embedding1)
    b = np.array(embedding2)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def find_similar(
    target_embedding: list[float],
    candidates: list[tuple[str, list[float]]],
    top_k: int = 10,
    threshold: float = 0.5,
) -> list[tuple[str, float]]:
    """
    Find the most similar candidates based on embedding cosine similarity.

    Args:
        target_embedding: The reference embedding to compare against.
        candidates: List of (candidate_id, embedding) tuples.
        top_k: Maximum number of results to return.
        threshold: Minimum similarity score to include.

    Returns:
        List of (candidate_id, similarity_score) tuples, sorted by similarity descending.
    """
    similarities = []
    for candidate_id, embedding in candidates:
        score = cosine_similarity(target_embedding, embedding)
        if score >= threshold:
            similarities.append((candidate_id, score))

    similarities.sort(key=lambda x: x[1], reverse=True)
    return similarities[:top_k]


def detect_duplicates(
    embeddings: list[tuple[str, list[float]]],
    threshold: float = 0.95,
) -> list[tuple[str, str, float]]:
    """
    Detect potential duplicate candidates based on resume similarity.

    Returns:
        List of (candidate_id_1, candidate_id_2, similarity_score) tuples.
    """
    duplicates = []
    for i in range(len(embeddings)):
        for j in range(i + 1, len(embeddings)):
            score = cosine_similarity(embeddings[i][1], embeddings[j][1])
            if score >= threshold:
                duplicates.append((embeddings[i][0], embeddings[j][0], score))

    return duplicates
