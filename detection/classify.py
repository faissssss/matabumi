"""
Enhanced rule-based deforestation cause classification module for MataBumi.
Classifies deforestation causes using advanced shape analysis and geographic heuristics.
"""

import numpy as np
from scipy import ndimage
from typing import Tuple, List

# Geographic heuristics - expanded with more provinces
MINING_PROVINCES = ["Kalimantan Timur", "Papua", "Papua Barat", "Maluku", "Kalimantan Selatan"]
PLANTATION_PROVINCES = ["Riau", "Sumatera Selatan", "Kalimantan Tengah", "Jambi", "Sumatera Utara"]
FIRE_PRONE_PROVINCES = ["Riau", "Kalimantan Tengah", "Kalimantan Barat", "Sumatera Selatan"]
LOGGING_PROVINCES = ["Papua", "Papua Barat", "Kalimantan Timur", "Sulawesi Tengah"]


def classify_cause(
    ndvi_change_patch: np.ndarray,
    province: str,
    bbox: List[float]
) -> Tuple[str, float]:
    """
    Classify deforestation cause using enhanced rule-based pattern analysis.
    
    Uses advanced shape metrics (fragmentation, compactness, elongation, convexity)
    and geographic heuristics to determine the likely cause of deforestation.
    
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
    # Create binary mask of deforested areas (change > 0.15 with new threshold)
    threshold = 0.15  # Lower threshold for more sensitivity
    deforested = ndvi_change_patch > threshold
    
    # Handle empty or very small patches
    if np.sum(deforested) < 10:
        return "unknown", 0.60
    
    # Calculate enhanced shape metrics
    fragmentation = calculate_fragmentation(deforested)
    compactness = calculate_compactness(deforested)
    mean_intensity = calculate_mean_intensity(ndvi_change_patch, deforested)
    elongation = calculate_elongation(deforested)
    convexity = calculate_convexity(deforested)
    edge_density = calculate_edge_density(deforested)
    
    # Count patches and calculate statistics
    labeled_array, num_patches = ndimage.label(deforested)
    total_area = np.sum(deforested)
    patch_sizes = [np.sum(labeled_array == i) for i in range(1, num_patches + 1)]
    avg_patch_size = np.mean(patch_sizes) if patch_sizes else 0
    max_patch_size = max(patch_sizes) if patch_sizes else 0
    patch_size_variance = np.var(patch_sizes) if len(patch_sizes) > 1 else 0
    
    # Apply enhanced decision rules with scoring system
    scores = {
        "mining": 0.0,
        "plantation": 0.0,
        "logging": 0.0,
        "fire": 0.0,
        "unknown": 0.0
    }
    
    # Mining indicators (compact, regular, high intensity)
    if mean_intensity > 0.4:  # Very high intensity
        scores["mining"] += 3.5
    if compactness < 2.0:  # Compact clearing
        scores["mining"] += 2.5
    if convexity > 0.8:  # Regular shape
        scores["mining"] += 2.0
    if fragmentation < 0.05:  # Very low fragmentation
        scores["mining"] += 1.5
    if num_patches <= 2:  # Few patches
        scores["mining"] += 1.0
    
    # Plantation indicators (very compact, regular, elongated)
    if compactness < 1.5:  # Very compact
        scores["plantation"] += 3.5
    if fragmentation < 0.08:  # Low fragmentation
        scores["plantation"] += 3.0
    if elongation > 2.5:  # Highly elongated (rows)
        scores["plantation"] += 2.5
    if convexity > 0.85:  # Very regular
        scores["plantation"] += 2.0
    if edge_density < 0.3:  # Smooth edges
        scores["plantation"] += 1.5
    if mean_intensity > 0.3 and mean_intensity < 0.5:  # Moderate-high intensity
        scores["plantation"] += 1.0
    
    # Logging indicators (fragmented, irregular, moderate intensity)
    if fragmentation > 0.15:  # High fragmentation
        scores["logging"] += 3.5
    if compactness > 2.5:  # Irregular shape
        scores["logging"] += 3.0
    if num_patches > 5:  # Many small patches
        scores["logging"] += 2.5
    if mean_intensity < 0.35:  # Moderate intensity
        scores["logging"] += 2.0
    if patch_size_variance > 100:  # Variable patch sizes
        scores["logging"] += 1.5
    if edge_density > 0.4:  # Complex edges
        scores["logging"] += 1.5
    
    # Fire indicators (large area, few patches, high intensity)
    if total_area > 1000:  # Large area
        scores["fire"] += 3.5
    if num_patches < 3:  # Few large patches
        scores["fire"] += 3.0
    if mean_intensity > 0.35:  # High intensity
        scores["fire"] += 2.5
    if compactness < 2.0:  # Relatively compact
        scores["fire"] += 2.0
    if max_patch_size > 500:  # At least one very large patch
        scores["fire"] += 1.5
    if convexity > 0.7:  # Relatively regular
        scores["fire"] += 1.0
    
    # Select cause with highest score
    max_score = max(scores.values())
    second_max_score = sorted(scores.values(), reverse=True)[1] if len(scores) > 1 else 0
    score_margin = max_score - second_max_score
    
    if max_score < 3.0:  # No strong indicators
        cause = "unknown"
        base_confidence = 0.60
    else:
        cause = max(scores, key=scores.get)
        # Confidence based on score strength and margin
        base_confidence = 0.60 + (max_score / 15.0) * 0.15
        # Boost confidence if there's a clear winner
        if score_margin > 2.0:
            base_confidence += 0.05
        base_confidence = min(0.78, base_confidence)
    
    # Apply geographic heuristics for confidence boost
    confidence = base_confidence
    
    if cause == "mining" and province in MINING_PROVINCES:
        confidence = min(0.85, confidence + 0.10)
    elif cause == "plantation" and province in PLANTATION_PROVINCES:
        confidence = min(0.85, confidence + 0.10)
    elif cause == "fire" and province in FIRE_PRONE_PROVINCES:
        confidence = min(0.85, confidence + 0.08)
    elif cause == "logging" and province in LOGGING_PROVINCES:
        confidence = min(0.85, confidence + 0.08)
    
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
    
    deforested_values = change_array[mask]
    return float(np.mean(deforested_values))


def calculate_elongation(mask: np.ndarray) -> float:
    """
    Calculate elongation ratio (major axis / minor axis).
    
    Plantations often show elongated patterns (rows of trees).
    
    Args:
        mask: Binary deforestation mask
    
    Returns:
        Elongation ratio (1.0 = circular, higher = more elongated)
    """
    if np.sum(mask) == 0:
        return 1.0
    
    # Find coordinates of deforested pixels
    coords = np.argwhere(mask)
    
    if len(coords) < 2:
        return 1.0
    
    # Calculate covariance matrix
    cov_matrix = np.cov(coords.T)
    
    # Get eigenvalues (represent major and minor axes)
    eigenvalues = np.linalg.eigvalsh(cov_matrix)
    
    if eigenvalues[0] == 0:
        return 1.0
    
    # Elongation is ratio of major to minor axis
    elongation = np.sqrt(eigenvalues[1] / eigenvalues[0])
    
    return float(elongation)


def calculate_convexity(mask: np.ndarray) -> float:
    """
    Calculate convexity (area / convex hull area).
    
    Regular clearings (mining, plantation) have high convexity.
    Irregular clearings (logging) have low convexity.
    
    Args:
        mask: Binary deforestation mask
    
    Returns:
        Convexity ratio (0.0 to 1.0, higher = more regular)
    """
    if np.sum(mask) == 0:
        return 0.0
    
    # Calculate actual area
    actual_area = np.sum(mask)
    
    # Calculate convex hull area using morphological closing
    # This approximates the convex hull
    struct = ndimage.generate_binary_structure(2, 2)
    convex_hull = ndimage.binary_closing(mask, structure=struct, iterations=5)
    convex_area = np.sum(convex_hull)
    
    if convex_area == 0:
        return 0.0
    
    # Convexity ratio
    convexity = actual_area / convex_area
    
    return float(convexity)


def calculate_edge_density(mask: np.ndarray) -> float:
    """
    Calculate edge density (perimeter / area).
    
    Logging typically has high edge density (complex boundaries).
    Plantations and mining have low edge density (smooth boundaries).
    
    Args:
        mask: Binary deforestation mask
    
    Returns:
        Edge density ratio (higher = more complex edges)
    """
    area = np.sum(mask)
    
    if area == 0:
        return 0.0
    
    # Calculate perimeter using edge detection
    dilated = ndimage.binary_dilation(mask)
    boundary = dilated & ~mask
    perimeter = np.sum(boundary)
    
    # Edge density
    edge_density = perimeter / area
    
    return float(edge_density)
