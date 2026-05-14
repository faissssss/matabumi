"""
Severity scoring module for MataBumi deforestation alerts.
Calculates severity scores and labels based on area, cause, and protected zone status.
"""

from typing import Tuple


PROTECTED_PROVINCES = ["Papua", "Papua Barat", "Kalimantan Timur"]

CAUSE_WEIGHTS = {
    "logging": 1.0,
    "mining": 0.9,
    "plantation": 0.7,
    "fire": 0.5,
    "unknown": 0.6,
}


def calculate_severity_score(area_ha: float, cause: str, province: str) -> Tuple[float, bool]:
    """
    Calculate bounded numeric severity score and protected-zone flag.
    """
    is_protected = province in PROTECTED_PROVINCES

    if area_ha < 100:
        area_score = 20
    elif area_ha < 500:
        area_score = 40
    elif area_ha < 2000:
        area_score = 70
    else:
        area_score = 90

    cause_weight = CAUSE_WEIGHTS.get(cause, 0.6)
    score = (area_score * 0.4) + (cause_weight * 100 * 0.4)

    if is_protected:
        score += 20

    return max(0, min(100, score)), is_protected


def calculate_severity(area_ha: float, cause: str, province: str) -> Tuple[str, bool]:
    """
    Calculate severity label for deforestation event.

    Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8,
    6.9, 6.10, 6.11, 6.12, 6.13, 6.14
    """
    score, is_protected = calculate_severity_score(area_ha, cause, province)

    if is_protected:
        severity_label = "critical"
    elif score >= 80:
        severity_label = "critical"
    elif score >= 60:
        severity_label = "high"
    elif score >= 35:
        severity_label = "moderate"
    else:
        severity_label = "low"

    return severity_label, is_protected
