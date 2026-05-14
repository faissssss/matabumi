import importlib.util
import sys
from datetime import datetime
from pathlib import Path


def load_validation_module():
    path = Path(__file__).with_name("validate_planetary_computer.py")
    spec = importlib.util.spec_from_file_location("validate_planetary_computer", path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


class FakeItem:
    def __init__(self, cloud_cover=10, assets=None):
        self.properties = {"eo:cloud_cover": cloud_cover, "datetime": "2026-05-01T00:00:00Z"}
        self.assets = assets if assets is not None else {"B08": object(), "B04": object()}


class FakeSearch:
    def __init__(self, items):
        self._items = items

    def items(self):
        return self._items


class FakeCatalog:
    def __init__(self, items=None, should_fail=False):
        self.items = items or []
        self.should_fail = should_fail
        self.last_query = None

    def search(self, **kwargs):
        if self.should_fail:
            raise RuntimeError("api unavailable")
        self.last_query = kwargs
        return FakeSearch(self.items)


def test_date_ranges_are_expected_windows():
    validation = load_validation_module()
    before, after = validation.get_date_ranges(datetime(2026, 5, 14))
    assert before == "2026-02-13/2026-03-15"
    assert after == "2026-04-14/2026-05-14"


def test_search_items_uses_cloud_cover_filter():
    validation = load_validation_module()
    catalog = FakeCatalog([FakeItem()])
    items = validation.search_items(catalog, validation.TEST_BBOX, "2026-01-01/2026-02-01")
    assert len(items) == 1
    assert catalog.last_query["query"] == {"eo:cloud_cover": {"lt": 25}}


def test_summarize_period_requires_usable_item_and_bands():
    validation = load_validation_module()
    result = validation.summarize_period(
        "before",
        [FakeItem(12), FakeItem(80), FakeItem(10, assets={"B08": object()})],
    )
    assert result.items_found == 3
    assert result.usable_items == 2
    assert result.has_required_bands is True
    assert result.passed is True


def test_api_failure_is_reported_cleanly(monkeypatch):
    validation = load_validation_module()
    monkeypatch.setattr(validation, "get_catalog", lambda: FakeCatalog(should_fail=True))
    assert validation.test_planetary_computer_access(download_sample=False) is False
