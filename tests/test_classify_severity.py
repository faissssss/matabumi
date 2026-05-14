import numpy as np
import pytest
from hypothesis import given, settings, strategies as st
from hypothesis.extra.numpy import arrays

from detection.classify import classify_cause
from detection.severity import PROTECTED_PROVINCES, calculate_severity, calculate_severity_score


VALID_CAUSES = {"logging", "plantation", "mining", "fire", "unknown"}
VALID_SEVERITIES = {"low", "moderate", "high", "critical"}


@given(
    patch=arrays(
        np.float64,
        st.tuples(st.integers(4, 30), st.integers(4, 30)),
        elements=st.floats(0, 1, allow_nan=False),
    ),
    province=st.sampled_from(["Aceh", "Riau", "Papua", "Kalimantan Timur"]),
)
@settings(max_examples=100)
def test_classifier_returns_valid_outputs(patch, province):
    cause, confidence = classify_cause(patch, province, [0, 0, 1, 1])
    assert cause in VALID_CAUSES
    assert 0.60 <= confidence <= 0.85


def test_classifier_empty_patch_returns_unknown():
    cause, confidence = classify_cause(np.zeros((20, 20)), "Aceh", [0, 0, 1, 1])
    assert cause == "unknown"
    assert confidence == 0.60


def test_classifier_detects_plantation_and_geographic_boost():
    patch = np.zeros((40, 40))
    patch[10:25, 10:25] = 0.3
    cause, confidence = classify_cause(patch, "Riau", [0, 0, 1, 1])
    assert cause == "plantation"
    assert confidence == pytest.approx(0.80)


def test_classifier_detects_mining_and_geographic_boost():
    patch = np.zeros((40, 40))
    patch[12:25, 12:25] = 0.55
    cause, confidence = classify_cause(patch, "Papua", [0, 0, 1, 1])
    assert cause == "mining"
    assert confidence == pytest.approx(0.78)


def test_classifier_detects_fire_for_large_contiguous_patch():
    patch = np.full((40, 40), 0.3)
    cause, confidence = classify_cause(patch, "Aceh", [0, 0, 1, 1])
    assert cause == "fire"
    assert confidence == 0.65


def test_classifier_detects_logging_for_fragmented_patch():
    patch = np.zeros((40, 40))
    patch[::3, ::3] = 0.3
    cause, confidence = classify_cause(patch, "Aceh", [0, 0, 1, 1])
    assert cause == "logging"
    assert confidence == 0.72


@given(
    area=st.floats(0, 10000, allow_nan=False),
    cause=st.sampled_from(["logging", "plantation", "mining", "fire", "unknown", "other"]),
    province=st.sampled_from(["Aceh", "Papua", "Riau", "Kalimantan Timur"]),
)
@settings(max_examples=100)
def test_severity_returns_valid_label_and_protected_flag(area, cause, province):
    label, is_protected = calculate_severity(area, cause, province)
    assert label in VALID_SEVERITIES
    assert is_protected == (province in PROTECTED_PROVINCES)


@given(
    area=st.floats(0, 10000, allow_nan=False),
    cause=st.sampled_from(["logging", "plantation", "mining", "fire", "unknown", "other"]),
    province=st.sampled_from(["Aceh", "Papua", "Riau", "Kalimantan Timur"]),
)
@settings(max_examples=100)
def test_severity_score_is_bounded(area, cause, province):
    score, is_protected = calculate_severity_score(area, cause, province)
    assert 0 <= score <= 100
    assert is_protected == (province in PROTECTED_PROVINCES)


def test_severity_label_threshold_examples():
    assert calculate_severity(20, "fire", "Aceh")[0] == "low"
    assert calculate_severity(120, "unknown", "Aceh")[0] == "moderate"
    assert calculate_severity(600, "mining", "Aceh")[0] == "high"
    assert calculate_severity(2500, "logging", "Papua")[0] == "critical"


def test_protected_provinces_are_always_critical():
    for province in PROTECTED_PROVINCES:
        label, is_protected = calculate_severity(1, "fire", province)
        assert label == "critical"
        assert is_protected is True
