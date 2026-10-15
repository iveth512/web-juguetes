# Root conftest for pytest - settings configured in pytest.ini
import pytest
from django.core.cache import cache


@pytest.fixture(autouse=True)
def _reset_throttles():
    """Throttle counters live in the cache; don't let them leak between tests."""
    cache.clear()
    yield


@pytest.fixture(autouse=True)
def _sync_emails(settings):
    """Send emails inline so tests can inspect mail.outbox deterministically."""
    settings.SEND_EMAILS_ASYNC = False
