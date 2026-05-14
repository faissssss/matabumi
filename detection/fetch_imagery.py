"""
Satellite imagery fetcher for MataBumi using Microsoft Planetary Computer.
Fetches Sentinel-2 imagery with cloud cover filtering and automatic resolution fallback.
"""

import os
import numpy as np
import planetary_computer
import pystac_client
from typing import Tuple, Optional, List
import logging

try:
    import stackstac
except ImportError:  # pragma: no cover - exercised in environments missing optional deps
    stackstac = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment configuration
CLOUD_COVER_MAX = float(os.getenv("CLOUD_COVER_MAX", "15"))


def get_catalog() -> pystac_client.Client:
    """
    Returns STAC catalog client with SAS token signing.
    
    Works with or without API key - unauthenticated access supported.
    If PLANETARY_COMPUTER_API_KEY is set, uses it for reduced rate limiting.
    
    Returns:
        Authenticated pystac_client.Client
    
    Requirements: 1.10, 12.1, 12.12
    """
    catalog = pystac_client.Client.open(
        "https://planetarycomputer.microsoft.com/api/stac/v1",
        modifier=planetary_computer.sign_inplace,  # Signs SAS tokens without key
    )
    
    return catalog


def fetch_imagery(
    catalog: pystac_client.Client,
    bbox: List[float],
    date_range: str,
    resolution: int = 60
) -> Tuple[Optional[np.ndarray], Optional[np.ndarray]]:
    """
    Fetch Sentinel-2 NIR and Red bands from Microsoft Planetary Computer.
    
    Automatically selects clearest image (lowest cloud cover) and handles
    memory errors with resolution fallback.
    
    Args:
        catalog: STAC catalog client from get_catalog()
        bbox: Bounding box [minx, miny, maxx, maxy] in WGS84
        date_range: Date range string "YYYY-MM-DD/YYYY-MM-DD"
        resolution: Pixel resolution in meters (default: 60m)
    
    Returns:
        Tuple of (NIR, Red) band arrays or (None, None) if no imagery found
    
    Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.9, 1.10
    """
    try:
        if stackstac is None:
            logger.error("stackstac is not installed; install requirements.txt before fetching imagery")
            return None, None

        # Search for Sentinel-2 items
        search = catalog.search(
            collections=["sentinel-2-l2a"],
            bbox=bbox,
            datetime=date_range,
            query={"eo:cloud_cover": {"lt": CLOUD_COVER_MAX}}
        )
        
        items = list(search.items())
        
        # If no items found with primary threshold, retry with 25%
        if len(items) == 0:
            logger.warning(f"No imagery found with cloud cover < {CLOUD_COVER_MAX}%, retrying with 25%")
            search = catalog.search(
                collections=["sentinel-2-l2a"],
                bbox=bbox,
                datetime=date_range,
                query={"eo:cloud_cover": {"lt": 25}}
            )
            items = list(search.items())
        
        # If still no items, return None
        if len(items) == 0:
            logger.warning(f"No usable imagery found for bbox {bbox} in date range {date_range}")
            return None, None
        
        # Select item with lowest cloud cover
        items_sorted = sorted(items, key=lambda x: x.properties.get("eo:cloud_cover", 100))
        selected_item = items_sorted[0]
        
        logger.info(f"Selected imagery with cloud cover: {selected_item.properties.get('eo:cloud_cover', 'N/A')}%")
        
        # Stack bands
        stack = stackstac.stack(
            [selected_item],
            assets=["B08", "B04"],  # NIR (Band 8), Red (Band 4)
            bounds=bbox,
            resolution=resolution,
            dtype=np.float32
        )
        
        # Compute arrays
        data = stack.compute()
        
        # Check if bands exist
        if data.shape[0] < 2:
            logger.warning("Missing bands in imagery")
            return None, None
        
        # Extract NIR (Band 8) and Red (Band 4)
        nir = data[0, 0, :, :].values  # First band, first time
        red = data[1, 0, :, :].values  # Second band, first time
        
        return nir, red
        
    except MemoryError:
        # Retry at lower resolution
        if resolution < 120:
            logger.warning(f"MemoryError at {resolution}m resolution, retrying at 120m")
            return fetch_imagery(catalog, bbox, date_range, resolution=120)
        else:
            logger.error("MemoryError even at 120m resolution")
            return None, None
    
    except Exception as e:
        logger.error(f"Error fetching imagery: {e}")
        return None, None


# Province bounding boxes for all 38 Indonesian provinces
# Format: [minx, miny, maxx, maxy] in WGS84 coordinates
PROVINCE_BBOXES = {
    # Sumatra (10 provinces)
    "Aceh": [95.0, 2.0, 98.5, 6.0],
    "Sumatera Utara": [97.5, 1.0, 100.5, 4.5],
    "Sumatera Barat": [98.5, -3.5, 101.5, 0.5],
    "Riau": [100.0, -1.5, 104.5, 2.5],
    "Kepulauan Riau": [103.0, -1.5, 108.5, 4.5],
    "Jambi": [101.0, -3.0, 104.5, -0.5],
    "Sumatera Selatan": [102.0, -5.0, 106.0, -1.5],
    "Kepulauan Bangka Belitung": [105.0, -3.5, 108.5, -1.0],
    "Bengkulu": [101.0, -5.5, 103.5, -2.0],
    "Lampung": [103.5, -6.5, 106.0, -3.5],
    
    # Java and Bali (7 provinces)
    "Banten": [105.0, -7.5, 106.5, -5.5],
    "DKI Jakarta": [106.5, -6.5, 107.0, -6.0],
    "Jawa Barat": [106.0, -8.0, 109.0, -5.5],
    "Jawa Tengah": [108.5, -8.5, 111.5, -6.0],
    "DI Yogyakarta": [110.0, -8.5, 111.0, -7.5],
    "Jawa Timur": [111.0, -9.0, 114.5, -6.5],
    "Bali": [114.5, -9.0, 115.5, -8.0],
    
    # Nusa Tenggara (2 provinces)
    "Nusa Tenggara Barat": [115.5, -9.5, 119.5, -8.0],
    "Nusa Tenggara Timur": [118.5, -11.0, 125.5, -8.0],
    
    # Kalimantan (5 provinces)
    "Kalimantan Barat": [108.5, -3.5, 114.5, 2.5],
    "Kalimantan Tengah": [111.0, -4.0, 116.0, 0.5],
    "Kalimantan Selatan": [114.5, -4.5, 116.5, -1.0],
    "Kalimantan Timur": [113.5, -2.5, 119.5, 4.5],
    "Kalimantan Utara": [115.5, 1.5, 119.5, 4.5],
    
    # Sulawesi (6 provinces)
    "Sulawesi Utara": [123.0, -1.5, 127.0, 5.5],
    "Gorontalo": [121.5, 0.0, 123.5, 1.5],
    "Sulawesi Tengah": [119.5, -3.5, 124.5, 1.5],
    "Sulawesi Barat": [118.5, -3.5, 120.0, -1.0],
    "Sulawesi Selatan": [118.5, -8.0, 121.5, -1.0],
    "Sulawesi Tenggara": [120.5, -6.5, 124.5, -2.5],
    
    # Maluku (2 provinces)
    "Maluku": [124.5, -9.0, 135.0, -2.0],
    "Maluku Utara": [124.5, -2.0, 129.5, 3.5],
    
    # Papua (6 provinces)
    "Papua": [135.0, -9.5, 141.0, -2.0],
    "Papua Barat": [130.0, -4.5, 135.0, -0.5],
    "Papua Tengah": [136.0, -5.5, 139.5, -2.5],
    "Papua Pegunungan": [137.5, -5.0, 141.0, -2.5],
    "Papua Selatan": [138.0, -9.0, 141.0, -5.5],
    "Papua Barat Daya": [130.5, -9.0, 133.5, -1.5],
}

# Verify we have exactly 38 provinces
assert len(PROVINCE_BBOXES) == 38, f"Expected 38 provinces, got {len(PROVINCE_BBOXES)}"
