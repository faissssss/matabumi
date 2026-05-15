import numpy as np

from detection import fetch_imagery as imagery


class FakeItem:
    def __init__(self, cloud_cover, assets=None):
        self.properties = {"eo:cloud_cover": cloud_cover}
        self.assets = assets if assets is not None else {"B08": object(), "B04": object()}


class FakeSearch:
    def __init__(self, items):
        self._items = items

    def items(self):
        return self._items


class FakeCatalog:
    def __init__(self, responses):
        self.responses = list(responses)
        self.queries = []

    def search(self, **kwargs):
        self.queries.append(kwargs)
        return FakeSearch(self.responses.pop(0))


class FakeBand:
    def __init__(self, values):
        self.values = values


class FakeComputed:
    shape = (2, 1, 10, 10)
    size = 200

    def __getitem__(self, key):
        band = key[0]
        return FakeBand(np.full((10, 10), band + 1, dtype=np.float32))


class FakeStack:
    def compute(self):
        return FakeComputed()


class FakeStackstac:
    def __init__(self):
        self.calls = []

    def stack(self, *args, **kwargs):
        self.calls.append(kwargs)
        return FakeStack()


class MemoryStackstac:
    def __init__(self):
        self.calls = []

    def stack(self, *args, **kwargs):
        self.calls.append(kwargs)
        if kwargs["resolution"] < 120:
            raise MemoryError()
        return FakeStack()


def test_fetch_imagery_filters_and_selects_lowest_cloud(monkeypatch):
    fake_stackstac = FakeStackstac()
    monkeypatch.setattr(imagery, "stackstac", fake_stackstac)
    catalog = FakeCatalog([[FakeItem(20), FakeItem(5)]])

    nir, red = imagery.fetch_imagery(catalog, [0, 0, 1, 1], "2026-01-01/2026-01-31")

    assert np.all(nir == 1)
    assert np.all(red == 2)
    assert fake_stackstac.calls[0]["resolution"] == 60
    assert fake_stackstac.calls[0]["bounds_latlon"] == [0, 0, 1, 1]
    assert fake_stackstac.calls[0]["epsg"] == 3857
    assert fake_stackstac.calls[0]["rescale"] is False


def test_fetch_imagery_retries_with_25_cloud_cover(monkeypatch):
    fake_stackstac = FakeStackstac()
    monkeypatch.setattr(imagery, "stackstac", fake_stackstac)
    catalog = FakeCatalog([[], [FakeItem(22)]])

    nir, red = imagery.fetch_imagery(catalog, [0, 0, 1, 1], "2026-01-01/2026-01-31")

    assert nir is not None
    assert catalog.queries[0]["query"] == {"eo:cloud_cover": {"lt": imagery.CLOUD_COVER_MAX}}
    assert catalog.queries[1]["query"] == {"eo:cloud_cover": {"lt": 25}}


def test_fetch_imagery_resolution_fallback_on_memory_error(monkeypatch):
    fake_stackstac = MemoryStackstac()
    monkeypatch.setattr(imagery, "stackstac", fake_stackstac)
    catalog = FakeCatalog([[FakeItem(5)], [FakeItem(5)]])

    nir, red = imagery.fetch_imagery(catalog, [0, 0, 1, 1], "2026-01-01/2026-01-31")

    assert nir is not None
    assert fake_stackstac.calls[-1]["resolution"] == 120


def test_fetch_imagery_returns_none_when_stackstac_missing(monkeypatch):
    monkeypatch.setattr(imagery, "stackstac", None)
    catalog = FakeCatalog([[FakeItem(5)]])
    assert imagery.fetch_imagery(catalog, [0, 0, 1, 1], "2026-01-01/2026-01-31") == (None, None)
