"""
Validate Microsoft Planetary Computer access for MataBumi.

The script is intentionally split into small helpers so its STAC behavior can
be unit-tested without network access. Running the file directly performs a
live validation over Aceh, including a small Sentinel-2 band sample when
stackstac is installed.
"""

from __future__ import annotations

import sys
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Iterable, Sequence

import planetary_computer
import pystac_client


TEST_BBOX = [95.0, 2.0, 98.5, 6.0]
REQUIRED_BANDS = ("B08", "B04")


@dataclass
class PeriodResult:
    name: str
    items_found: int
    usable_items: int
    cloud_covers: list[float]
    has_required_bands: bool

    @property
    def passed(self) -> bool:
        return self.usable_items >= 1 and self.has_required_bands


def get_date_ranges(today: datetime | None = None) -> tuple[str, str]:
    today = today or datetime.now()
    before_start = today - timedelta(days=90)
    before_end = today - timedelta(days=60)
    after_start = today - timedelta(days=30)
    after_end = today
    return (
        f"{before_start:%Y-%m-%d}/{before_end:%Y-%m-%d}",
        f"{after_start:%Y-%m-%d}/{after_end:%Y-%m-%d}",
    )


def get_catalog():
    return pystac_client.Client.open(
        "https://planetarycomputer.microsoft.com/api/stac/v1",
        modifier=planetary_computer.sign_inplace,
    )


def search_items(catalog, bbox: Sequence[float], date_range: str, cloud_cover_max: float = 25):
    search = catalog.search(
        collections=["sentinel-2-l2a"],
        bbox=list(bbox),
        datetime=date_range,
        query={"eo:cloud_cover": {"lt": cloud_cover_max}},
    )
    return list(search.items())


def cloud_cover(item) -> float:
    value = item.properties.get("eo:cloud_cover", 100)
    return float(value)


def has_required_bands(item) -> bool:
    return all(band in item.assets for band in REQUIRED_BANDS)


def summarize_period(name: str, items: Iterable) -> PeriodResult:
    item_list = list(items)
    usable = [item for item in item_list if cloud_cover(item) < 25]
    covers = [cloud_cover(item) for item in usable]
    return PeriodResult(
        name=name,
        items_found=len(item_list),
        usable_items=len(usable),
        cloud_covers=covers,
        has_required_bands=bool(usable) and has_required_bands(usable[0]),
    )


def download_small_sample(item, bbox: Sequence[float], sample_size: int = 10) -> bool:
    try:
        import stackstac
    except ImportError:
        print("  Sample download skipped: stackstac is not installed in this environment")
        return False

    try:
        stack = stackstac.stack(
            [item],
            assets=list(REQUIRED_BANDS),
            bounds_latlon=list(bbox),
            epsg=3857,
            resolution=120,
            dtype="float64",
            rescale=False,
        )
        sample = stack.isel(x=slice(0, sample_size), y=slice(0, sample_size)).compute()
        valid = sample.shape[-1] > 0 and sample.shape[-2] > 0
        print(f"  Downloaded sample array shape: {tuple(sample.shape)}")
        return bool(valid)
    except Exception as exc:
        print(f"  Sample download failed: {exc}")
        return False


def print_period_result(result: PeriodResult) -> None:
    print(f"{result.name}:")
    print(f"  Items found: {result.items_found}")
    print(f"  Usable items (<25% cloud): {result.usable_items}")
    if result.cloud_covers:
        print(
            "  Cloud cover range: "
            f"{min(result.cloud_covers):.2f}% - {max(result.cloud_covers):.2f}%"
        )
    print(f"  Required bands present: {result.has_required_bands}")


def test_planetary_computer_access(download_sample: bool = True) -> bool:
    print("=" * 80)
    print("VALIDATING MICROSOFT PLANETARY COMPUTER API ACCESS")
    print("=" * 80)
    print(f"Test area: Aceh Province, bbox={TEST_BBOX}")

    before_range, after_range = get_date_ranges()
    print(f"Before period: {before_range}")
    print(f"After period: {after_range}")

    try:
        catalog = get_catalog()
        before_items = search_items(catalog, TEST_BBOX, before_range)
        after_items = search_items(catalog, TEST_BBOX, after_range)

        before_result = summarize_period("Before period", before_items)
        after_result = summarize_period("After period", after_items)
        print_period_result(before_result)
        print_period_result(after_result)

        sample_ok = True
        if download_sample and before_items and has_required_bands(before_items[0]):
            sample_ok = download_small_sample(before_items[0], TEST_BBOX)

        passed = before_result.passed and after_result.passed and sample_ok
        print("=" * 80)
        print("VALIDATION PASSED" if passed else "VALIDATION FAILED")
        print("=" * 80)
        return passed
    except Exception as exc:
        print("=" * 80)
        print("VALIDATION FAILED")
        print("=" * 80)
        print(f"Error: {exc}")
        return False


if __name__ == "__main__":
    success = test_planetary_computer_access()
    sys.exit(0 if success else 1)
