from __future__ import annotations

import sys
from pathlib import Path

import evidenceops


def test_python_runtime_meets_minimum() -> None:
    assert sys.version_info >= (3, 12)


def test_workers_namespace_imports() -> None:
    assert evidenceops.__version__ == "0.0.0"


def test_pyproject_pins_python_312() -> None:
    pyproject = Path("pyproject.toml").read_text(encoding="utf-8")
    assert 'requires-python = ">=3.12"' in pyproject
