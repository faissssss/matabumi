"""
Rule-based deforestation cause classification module for MataBumi.
Classifies deforestation causes using shape analysis and geographic heuristics.
"""

import numpy as np
from scipy import ndimage
from typing import Tuple, List

# Geographic heuristics
MINING_PROVINCES = ["Kalimantan Timur", "Papua", "Maluku"]
PLANTATION_PROVINCES = ["Riau", "Sumatera Selatan", "Kalimantan Tengah"]


def classify_cause(
    ndvi_change_patch: np.ndarray,
    province: str,
    bbox: List[float]
) -> Tuple[str, float]:
    """
    Classify deforestation cause using rule-based pattern analysis.
    
    Uses shape metrics (fragmentation, compactness, intensity) and
    geographic heuristics to determine the likely cause of deforestation.
    
    Args:
        ndvi_change_patch: NDVI change array (center crop from full change map)
        province: Province name for geographic heuristics
        bbox: Bounding box coordinates [minx, miny, maxx, maxy]
    
    Returns:
        Tuple of (cause_label, confidence_score):
        - cause_label: "logging" | "plantation" | "mining" | "fire" | "unknown"
        - confidence_score: Float between 0.60 and 0.85
    
    Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10
    """
    # Create binary mask of deforested areas (change > 0.2)
    deforested = ndvi_change_patch > 0.2
    
    # Handle empty or very small patches
    if np.sum(deforested) < 10:
        return "unknown", 0.60
    
    # Calculate shape metrics
    fragmentation = calculate_fragmentation(deforested)
    compactness = calculate_compactness(deforested)
    mean_intensity = calculate_mean_intensity(ndvi_change_patch, deforested)
    
    # Count patches
    labeled_array, num_patches = ndimage.label(deforested)
    total_area = np.sum(deforested)
    
    # Apply decision rules
    cause = "unknown"
    base_confidence = 0.60
    
    # Rule 1: Mining (high intensity, compact clearing)
    if mean_intensity > 0.4 and compactness < 2.0:
        cause = "mining"
        base_confidence = 0.68

    # Rule 2: Fire (large contiguous areas)
    elif num_patches < 3 and total_area > 1000:
        cause = "fire"
        base_confidence = 0.65

    # Rule 3: Plantation (geometric clearing)
    elif compactness < 1.5 and fragmentation < 0.1:
        cause = "plantation"
        base_confidence = 0.70

    # Rule 4: Logging (irregular, fragmented)
    elif fragmentation > 0.15 and compactness > 2.5:
        cause = "logging"
        base_confidence = 0.72
    
    # Default: Logging (most common in Indonesia)
    else:
        cause = "logging"
        base_confidence = 0.62
    
    # Apply geographic heuristics
    confidence = base_confidence
    
    if cause == "mining" and province in MINING_PROVINCES:
        confidence = min(0.85, confidence + 0.10)
    
    if cause == "plantation" and province in PLANTATION_PROVINCES:
        confidence = min(0.85, confidence + 0.10)
    
    # Ensure confidence is within bounds
    confidence = max(0.60, min(0.85, confidence))
    
    return cause, confidence


def calculate_fragmentation(mask: np.ndarray) -> float:
    """
    Calculate fragmentation index as (number of patches / total area).
    
    Args:
        mask: Binary deforestation mask
    
    Returns:
        Fragmentation index (higher = more fragmented)
    """
    labeled_array, num_patches = ndimage.label(mask)
    total_area = np.sum(mask)
    
    if total_area == 0:
        return 0.0
    
    return num_patches / total_area


def calculate_compactness(mask: np.ndarray) -> float:
    """
    Calculate compactness as (perimeter² / (4π × area)).
    
    A circle has compactness = 1.0 (most compact).
    Irregular shapes have higher compactness values.
    
    Args:
        mask: Binary deforestation mask
    
    Returns:
        Compactness measure (1.0 = perfect circle, higher = more irregular)
    """
    # Calculate area
    area = np.sum(mask)
    
    if area == 0:
        return 0.0
    
    # Calculate perimeter using edge detection
    # Dilate and subtract to find boundary pixels
    dilated = ndimage.binary_dilation(mask)
    boundary = dilated & ~mask
    perimeter = np.sum(boundary)
    
    if perimeter == 0:
        return 1.0
    
    # Compactness formula
    compactness = (perimeter ** 2) / (4 * np.pi * area)
    
    return compactness


def calculate_mean_intensity(change_array: np.ndarray, mask: np.ndarray) -> float:
    """
    Calculate mean NDVI change intensity in deforested pixels.
    
    Args:
        change_array: NDVI change values
        mask: Binary mask indicating deforested pixels
    
    Returns:
        Mean NDVI change in deforested areas
    """
    if np.sum(mask) == 0:
        return 0.0
    
    # Extract values where mask is True
    deforested_values = change_array[mask]
    
    return float(np.mean(deforested_values))
