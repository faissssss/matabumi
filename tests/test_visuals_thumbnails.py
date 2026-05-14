from pathlib import Path

import numpy as np
from PIL import Image

from detection.ndvi import save_hero_image
from detection.thumbnails import extract_thumbnail


def test_save_hero_image_creates_png(workspace_tmp):
    before = np.full((16, 16), 0.7)
    after = np.full((16, 16), 0.4)
    change = before - after
    path = save_hero_image(before, after, change, "Aceh", output_dir=str(workspace_tmp))

    image_path = Path(path)
    assert image_path.exists()
    assert image_path.name == "matabumi_aceh.png"
    with Image.open(image_path) as image:
        assert image.format == "PNG"
        assert image.size[0] > image.size[1]


def test_extract_thumbnail_creates_256_jpeg(workspace_tmp):
    nir = np.ones((300, 300)) * 800
    red = np.ones((300, 300)) * 400
    green = np.ones((300, 300)) * 250
    mask = np.zeros((300, 300), dtype=bool)
    mask[140:160, 140:160] = True

    relative_path = extract_thumbnail(
        nir, red, green, mask, "Aceh", "2026-05-14", 7, output_dir=str(workspace_tmp)
    )

    assert relative_path is not None
    image_path = workspace_tmp / "Aceh_2026-05-14_7.jpg"
    assert image_path.exists()
    with Image.open(image_path) as image:
        assert image.format == "JPEG"
        assert image.size == (256, 256)


def test_extract_thumbnail_returns_none_for_empty_mask(workspace_tmp):
    band = np.ones((20, 20))
    mask = np.zeros((20, 20), dtype=bool)
    assert extract_thumbnail(band, band, band, mask, "Aceh", "2026-05-14", 1, str(workspace_tmp)) is None
