from hypothesis import HealthCheck, settings
import shutil
from pathlib import Path
from uuid import uuid4

import pytest


settings.register_profile(
    "ci",
    database=None,
    suppress_health_check=[HealthCheck.too_slow],
)
settings.load_profile("ci")


@pytest.fixture
def workspace_tmp():
    path = Path("test_artifacts") / uuid4().hex
    path.mkdir(parents=True, exist_ok=True)
    try:
        yield path
    finally:
        shutil.rmtree(path, ignore_errors=True)
