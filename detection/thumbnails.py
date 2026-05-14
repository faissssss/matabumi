"""
Thumbnail extraction module for MataBumi.
Extracts and saves satellite image patches for web dashboard display.
"""

import numpy as np
import os
from PIL import Image
from typing import Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def extract_thumbnail(
    nir: np.ndarray,
    red: np.ndarray,
    green: np.ndarray,
    change_mask: np.ndarray,
    province: str,
    date: str,
    event_id: int,
    output_dir: str = "outputs/thumbnails"
) -> Optional[str]:
    """
    Extract and save satellite image patch for web display.
    
    Creates a 256x256 pixel false-color composite (NIR-Red-Green) centered
    on the deforestation area and saves as JPEG.
    
    Args:
        nir: Near-infrared band array
        red: Red band array
        green: Green band array
        change_mask: Binary mask indicating deforestation pixels
        province: Province name
        date: Detection date (YYYY-MM-DD format)
        event_id: Unique event identifier
        output_dir: Directory to save thumbnails (default: "outputs/thumbnails")
    
    Returns:
        Relative file path to saved thumbnail or None on error
    
    Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.9, 8.10
    """
    try:
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Find centroid of change mask
        y_coords, x_coords = np.where(change_mask)
        
        if len(y_coords) == 0:
            logger.warning("Empty change mask, cannot extract thumbnail")
            return None
        
        centroid_y = int(np.mean(y_coords))
        centroid_x = int(np.mean(x_coords))
        
        # Define 256x256 window centered on centroid
        half_size = 128
        y_start = max(0, centroid_y - half_size)
        y_end = min(nir.shape[0], centroid_y + half_size)
        x_start = max(0, centroid_x - half_size)
        x_end = min(nir.shape[1], centroid_x + half_size)
        
        # Extract patches
        nir_patch = nir[y_start:y_end, x_start:x_end]
        red_patch = red[y_start:y_end, x_start:x_end]
        green_patch = green[y_start:y_end, x_start:x_end]
        
        # Normalize bands to 0-255 range
        def normalize_band(band):
            # Handle NaN values
            band = np.nan_to_num(band, nan=0.0)
            
            # Clip to reasonable range (2nd to 98th percentile)
            p2, p98 = np.percentile(band, [2, 98])
            band_clipped = np.clip(band, p2, p98)
            
            # Normalize to 0-255
            if p98 > p2:
                band_norm = ((band_clipped - p2) / (p98 - p2) * 255).astype(np.uint8)
            else:
                band_norm = np.zeros_like(band, dtype=np.uint8)
            
            return band_norm
        
        nir_norm = normalize_band(nir_patch)
        red_norm = normalize_band(red_patch)
        green_norm = normalize_band(green_patch)
        
        # Stack as RGB false-color composite (NIR→R, Red→G, Green→B)
        rgb = np.stack([nir_norm, red_norm, green_norm], axis=-1)
        
        # Resize to exactly 256x256 if needed
        if rgb.shape[0] != 256 or rgb.shape[1] != 256:
            img = Image.fromarray(rgb)
            img = img.resize((256, 256), Image.Resampling.LANCZOS)
            rgb = np.array(img)
        
        # Save as JPEG with quality=85
        filename = f"{province.replace(' ', '_')}_{date}_{event_id}.jpg"
        filepath = os.path.join(output_dir, filename)
        
        img = Image.fromarray(rgb)
        img.save(filepath, "JPEG", quality=85)
        
        # Return relative path
        relative_path = os.path.join("outputs/thumbnails", filename)
        logger.info(f"Saved thumbnail: {relative_path}")
        
        return relative_path
        
    except Exception as e:
        logger.error(f"Error extracting thumbnail: {e}")
        return None
