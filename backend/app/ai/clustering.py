"""
Candidate clustering and advanced ML features using scikit-learn.

Provides:
- K-Means clustering by skill profiles
- PCA dimensionality reduction for visualization
- Skill-gap analysis
"""

import logging
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)


def cluster_candidates(
    embeddings: list[list[float]],
    candidate_ids: list[str],
    n_clusters: int = 5,
) -> dict[str, Any]:
    """
    Cluster candidates using K-Means on their resume embeddings.

    Returns:
        Dict with cluster assignments and cluster centers.
    """
    try:
        from sklearn.cluster import KMeans
        from sklearn.decomposition import PCA

        X = np.array(embeddings)

        # Adjust n_clusters if fewer candidates than clusters
        n_clusters = min(n_clusters, len(embeddings))
        if n_clusters < 2:
            return {
                "clusters": {candidate_ids[0]: 0} if candidate_ids else {},
                "visualization": [],
            }

        # K-Means clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X)

        # PCA for 2D visualization
        pca = PCA(n_components=2)
        coords = pca.fit_transform(X)

        # Build result
        clusters = {
            candidate_ids[i]: int(labels[i])
            for i in range(len(candidate_ids))
        }

        visualization = [
            {
                "candidate_id": candidate_ids[i],
                "cluster": int(labels[i]),
                "x": float(coords[i][0]),
                "y": float(coords[i][1]),
            }
            for i in range(len(candidate_ids))
        ]

        return {
            "clusters": clusters,
            "n_clusters": n_clusters,
            "visualization": visualization,
        }

    except Exception as e:
        logger.error(f"Clustering failed: {e}")
        return {"clusters": {}, "visualization": []}


def skill_gap_analysis(
    candidate_skills: list[str],
    required_skills: list[str],
    preferred_skills: list[str] | None = None,
) -> dict:
    """
    Analyze skill gaps between a candidate and job requirements.

    Returns:
        Dict with matched, missing, and extra skills.
    """
    candidate_set = {s.lower().strip() for s in candidate_skills}
    required_set = {s.lower().strip() for s in required_skills}
    preferred_set = {s.lower().strip() for s in (preferred_skills or [])}

    matched_required = candidate_set & required_set
    missing_required = required_set - candidate_set
    matched_preferred = candidate_set & preferred_set
    missing_preferred = preferred_set - candidate_set
    extra_skills = candidate_set - required_set - preferred_set

    # Calculate match score
    required_score = (len(matched_required) / len(required_set) * 100) if required_set else 100
    preferred_score = (len(matched_preferred) / len(preferred_set) * 100) if preferred_set else 100
    overall_match = required_score * 0.7 + preferred_score * 0.3

    return {
        "matched_required": sorted(matched_required),
        "missing_required": sorted(missing_required),
        "matched_preferred": sorted(matched_preferred),
        "missing_preferred": sorted(missing_preferred),
        "extra_skills": sorted(extra_skills),
        "required_match_pct": round(required_score, 1),
        "preferred_match_pct": round(preferred_score, 1),
        "overall_match_score": round(overall_match, 1),
    }
