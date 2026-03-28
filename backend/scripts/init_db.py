import sys
from pathlib import Path

from sqlalchemy import create_engine

# Ensure project root is on sys.path so backend imports work when run as a script
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.core.config import get_settings  # noqa: E402
from backend.core.database import Base  # noqa: E402

# Import models so they register metadata
import backend.models  # noqa: E402,F401


def main() -> None:
    settings = get_settings()
    engine = create_engine(settings.database_url, future=True)
    print(f"Creating tables on {settings.database_url} ...")
    Base.metadata.create_all(bind=engine)
    print("Done.")


if __name__ == "__main__":
    main()
