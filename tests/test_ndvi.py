import numpy as np
from hypothesis import given, settings, strategies as st
from hypothesis.extra.numpy import arrays

from detection.ndvi import calculate_ndvi, detect_change, estimate_area


array_shapes = st.tuples(st.integers(1, 20), st.integers(1, 20))
positive_arrays = array_shapes.flatmap(
    lambda shape: arrays(np.float64, shape, elements=st.floats(0, 10000, allow_nan=False))
)


@given(nir=positive_arrays, red=positive_arrays)
@settings(max_examples=100)
def test_ndvi_values_are_bounded_for_positive_inputs(nir, red):
    if nir.shape != red.shape:
        return
    ndvi = calculate_ndvi(nir, red)
    assert np.all(ndvi <= 1.0)
    assert np.all(ndvi >= -1.0)


@given(shape=array_shapes)
@settings(max_examples=100)
def test_ndvi_preserves_array_shape(shape):
    nir = np.ones(shape)
    red = np.zeros(shape)
    assert calculate_ndvi(nir, red).shape == shape


def test_ndvi_handles_zero_inputs_without_division_errors():
    ndvi = calculate_ndvi(np.zeros((3, 3)), np.zeros((3, 3)))
    assert np.all(np.isfinite(ndvi))
    assert np.all(ndvi == 0)


@given(shape=array_shapes)
@settings(max_examples=100)
def test_change_detection_formula_correctness(shape):
    before = np.full(shape, 0.7)
    after = np.full(shape, 0.4)
    change, mask = detect_change(before, after)
    np.testing.assert_allclose(change, before - after)
    assert mask.shape == shape


@given(mask=arrays(bool, array_shapes))
@settings(max_examples=100)
def test_area_is_non_negative(mask):
    assert estimate_area(mask, resolution_m=60) >= 0.0


@given(mask=arrays(bool, array_shapes))
@settings(max_examples=100)
def test_area_scales_with_resolution(mask):
    area_30 = estimate_area(mask, resolution_m=30)
    area_60 = estimate_area(mask, resolution_m=60)
    assert area_60 == area_30 * 4
