"""
tests/conftest.py — Shared pytest fixtures for Hybrid NIDS tests.
"""

import os
import sys
import tempfile
import pytest

# Ensure project root is on the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Use an in-memory / temp DB during testing
os.environ.setdefault("DATABASE_PATH", os.path.join(tempfile.gettempdir(), "nids_test.db"))


@pytest.fixture(scope="session")
def app():
    """Create a Flask test application."""
    from backend.app import create_app
    application = create_app()
    application.config["TESTING"] = True
    return application


@pytest.fixture(scope="session")
def client(app):
    """Return a Flask test client."""
    return app.test_client()
