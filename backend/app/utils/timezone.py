import time
import zoneinfo
from datetime import datetime


def get_current_timezone():
    """Get the current system timezone"""
    try:
        # Get the system timezone
        return zoneinfo.ZoneInfo(time.tzname[0])
    except Exception:  # noqa: E722
        # Fallback to local timezone
        return datetime.now().astimezone().tzinfo


def now_with_timezone():
    """Get current datetime with system timezone"""
    return datetime.now(get_current_timezone())
