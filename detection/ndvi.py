"""
NDVI calculation and change detection module for MataBumi.
Implements vegetation index calculation, change detection, area estimation,
and hero image visualization generation.
"""

import numpy as np
import matplotlib
# Use non-interactive backend for thread safety
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import os
from typing import Tuple

# Constants
EPSILON = 1e-10  # Prevents division by zero
NDVI_CHANGE_THRESHOLD = float(os.getenv("NDVI_CHANGE_THRESHOLD", "0.2"))
MINIMUM_ALERT_AREA = float(os.getenv("MINIMUM_ALERT_AREA", "50"))


def calculate_ndvi(nir: np.ndarray, red: np.ndarray) -> np.ndarray:
    """
    Calculate Normalized Difference Vegetation Index (NDVI) from satellite bands.
    
    Formula: NDVI = (NIR - Red) / (NIR + Red + epsilon)
    
    Args:
        nir: Near-infrared band array (Band 8 for Sentinel-2)
        red: Red band array (Band 4 for Sentinel-2)
    
    Returns:
        NDVI array with values between -1.0 and 1.0
        NaN values are propagated from input arrays
    
    Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
    """
    # Use float64 precision for calculations
    nir = nir.astype(np.float64)
    red = red.astype(np.float64)
    
    # Calculate NDVI with epsilon to prevent division by zero
    ndvi = (nir - red) / (nir + red + EPSILON)
    
    return ndvi


def detect_change(
    ndvi_before: np.ndarray,
    ndvi_after: np.ndarray
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Detect vegetation loss by comparing NDVI values over time.
    
    Args:
        ndvi_before: NDVI array from before period (60-90 days ago)
        ndvi_after: NDVI array from after period (0-30 days ago)
    
    Returns:
        Tuple of (change_map, deforestation_mask):
        - change_map: NDVI decrease values (before - after)
        - deforestation_mask: Boolean array where change exceeds threshold
    
    Requirements: 3.1, 3.2, 3.3
    """
    # Calculate change as (before - after)
    # Positive values indicate vegetation loss
    change_map = ndvi_before - ndvi_after
    
    # Create binary mask where change exceeds threshold
    deforestation_mask = change_map > NDVI_CHANGE_THRESHOLD
    
    return change_map, deforestation_mask


def estimate_area(mask: np.ndarray, resolution_m: int = 60) -> float:
    """
    Estimate deforestation area in hectares from binary mask.
    
    Args:
        mask: Boolean array indicating deforestation pixels
        resolution_m: Pixel resolution in meters (default: 60m)
    
    Returns:
        Area in hectares (non-negative float)
    
    Requirements: 3.4, 3.5, 3.6
    """
    # Count deforestation pixels
    pixel_count = np.sum(mask)
    
    # Calculate pixel area in square meters
    pixel_area_m2 = resolution_m ** 2
    
    # Convert to hectares (1 hectare = 10,000 m²)
    area_ha = (pixel_count * pixel_area_m2) / 10000.0
    
    return float(area_ha)


def save_hero_image(
    ndvi_before: np.ndarray,
    ndvi_after: np.ndarray,
    change: np.ndarray,
    province: str,
    output_dir: str = "outputs"
) -> str:
    """
    Generate before/after/change NDVI visualization for PDF submission.
    
    Creates a three-panel figure showing:
    - Left: NDVI before (60-90 days ago)
    - Center: NDVI after (0-30 days ago)
    - Right: NDVI change (vegetation loss)
    
    Args:
        ndvi_before: NDVI array from before period
        ndvi_after: NDVI array from after period
        change: NDVI change array (before - after)
        province: Province name for title
        output_dir: Directory to save image (default: "outputs")
    
    Returns:
        Path to saved PNG file
    
    Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10
    """
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Create figure with dark background
    fig, axes = plt.subplots(1, 3, figsize=(18, 6), facecolor='#0D1117')
    
    # Configure each subplot
    for ax in axes:
        ax.set_facecolor('#0D1117')
        ax.tick_params(colors='white')
    
    # Panel 1: NDVI Before
    im1 = axes[0].imshow(ndvi_before, cmap='RdYlGn', vmin=-0.2, vmax=0.9)
    axes[0].set_title('NDVI Before (60-90 days ago)', color='white', fontsize=14)
    axes[0].axis('off')
    plt.colorbar(im1, ax=axes[0], fraction=0.046, pad=0.04)
    
    # Panel 2: NDVI After
    im2 = axes[1].imshow(ndvi_after, cmap='RdYlGn', vmin=-0.2, vmax=0.9)
    axes[1].set_title('NDVI After (0-30 days ago)', color='white', fontsize=14)
    axes[1].axis('off')
    plt.colorbar(im2, ax=axes[1], fraction=0.046, pad=0.04)
    
    # Panel 3: Change
    im3 = axes[2].imshow(change, cmap='Reds', vmin=0, vmax=0.5)
    axes[2].set_title('NDVI Change (Vegetation Loss)', color='white', fontsize=14)
    axes[2].axis('off')
    plt.colorbar(im3, ax=axes[2], fraction=0.046, pad=0.04)
    
    # Add main title with province name
    fig.suptitle(f'MataBumi Deforestation Detection - {province}', 
                 color='white', fontsize=16, fontweight='bold')
    
    # Save with high DPI for PDF quality
    filename = f"matabumi_{province.lower().replace(' ', '_')}.png"
    filepath = os.path.join(output_dir, filename)
    plt.savefig(filepath, dpi=200, bbox_inches='tight', facecolor='#0D1117')
    plt.close()
    
    return filepath
