import sys
from pathlib import Path

from sqlalchemy import create_engine, text

# Ensure project root is on sys.path so backend imports work when run as a script
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.core.config import get_settings  # noqa: E402


def _exists(conn, query: str, **params) -> bool:
    return conn.execute(text(query), params).scalar_one() > 0


def main() -> None:
    settings = get_settings()
    engine = create_engine(settings.database_url, future=True)

    with engine.begin() as conn:
        has_user_id = _exists(
            conn,
            """
            SELECT COUNT(*)
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'doctors'
              AND COLUMN_NAME = 'user_id'
            """,
        )

        if not has_user_id:
            conn.execute(text("ALTER TABLE doctors ADD COLUMN user_id INT NULL AFTER id"))
            print("Added doctors.user_id column")
        else:
            print("doctors.user_id already exists")

        has_unique_idx = _exists(
            conn,
            """
            SELECT COUNT(*)
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'doctors'
              AND INDEX_NAME = 'ux_doctors_user_id'
            """,
        )

        if not has_unique_idx:
            conn.execute(text("CREATE UNIQUE INDEX ux_doctors_user_id ON doctors (user_id)"))
            print("Created unique index ux_doctors_user_id")
        else:
            print("Unique index ux_doctors_user_id already exists")

        has_fk = _exists(
            conn,
            """
            SELECT COUNT(*)
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'doctors'
              AND COLUMN_NAME = 'user_id'
              AND REFERENCED_TABLE_NAME = 'users'
            """,
        )

        if not has_fk:
            conn.execute(
                text(
                    """
                    ALTER TABLE doctors
                    ADD CONSTRAINT fk_doctors_user_id
                    FOREIGN KEY (user_id) REFERENCES users(id)
                    ON DELETE CASCADE
                    """
                )
            )
            print("Created foreign key fk_doctors_user_id")
        else:
            print("Foreign key on doctors.user_id already exists")

    print("Doctor-user schema migration complete.")


if __name__ == "__main__":
    main()
