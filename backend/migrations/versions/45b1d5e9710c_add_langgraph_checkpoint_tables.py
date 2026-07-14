"""Add LangGraph checkpoint tables.

Revision ID: 45b1d5e9710c
Revises: a3f2c1d4e5b6
Create Date: 2026-07-11

Tạo 4 bảng + 3 index cho AsyncPostgresSaver (langgraph-checkpoint-postgres).
Schema được lấy trực tiếp từ AsyncPostgresSaver.MIGRATIONS (v3.1.0, migrations 0–9).

Bảng:
  - checkpoint_migrations  : tracking version schema của LangGraph
  - checkpoints            : lưu snapshot state mỗi thread/step
  - checkpoint_blobs       : lưu binary channel state data
  - checkpoint_writes      : lưu pending writes giữa các node

QUAN TRỌNG: Migration này dùng raw SQL vì schema thuộc sở hữu của LangGraph,
không phải SQLAlchemy models của ứng dụng → không dùng autogenerate.
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "45b1d5e9710c"
down_revision = "a3f2c1d4e5b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Migration 0: tracking table ──────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS checkpoint_migrations (
            v INTEGER PRIMARY KEY
        )
    """)

    # ── Migration 1: checkpoints ─────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS checkpoints (
            thread_id           TEXT    NOT NULL,
            checkpoint_ns       TEXT    NOT NULL DEFAULT '',
            checkpoint_id       TEXT    NOT NULL,
            parent_checkpoint_id TEXT,
            type                TEXT,
            checkpoint          JSONB   NOT NULL,
            metadata            JSONB   NOT NULL DEFAULT '{}',
            PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
        )
    """)

    # ── Migration 2: checkpoint_blobs ─────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS checkpoint_blobs (
            thread_id       TEXT    NOT NULL,
            checkpoint_ns   TEXT    NOT NULL DEFAULT '',
            channel         TEXT    NOT NULL,
            version         TEXT    NOT NULL,
            type            TEXT    NOT NULL,
            blob            BYTEA,
            PRIMARY KEY (thread_id, checkpoint_ns, channel, version)
        )
    """)

    # ── Migration 3: checkpoint_writes ────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS checkpoint_writes (
            thread_id       TEXT    NOT NULL,
            checkpoint_ns   TEXT    NOT NULL DEFAULT '',
            checkpoint_id   TEXT    NOT NULL,
            task_id         TEXT    NOT NULL,
            idx             INTEGER NOT NULL,
            channel         TEXT    NOT NULL,
            type            TEXT,
            blob            BYTEA   NOT NULL,
            task_path       TEXT    NOT NULL DEFAULT '',
            PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, idx)
        )
    """)

    # ── Migrations 4–5: schema adjustments (already baked into CREATE above) ─
    # Migration 4: ALTER TABLE checkpoint_blobs ALTER COLUMN blob DROP NOT NULL
    #   → baked in: blob BYTEA (nullable) trong CREATE TABLE
    # Migration 5: SELECT 1 (no-op)

    # ── Migrations 6–8: indexes ───────────────────────────────────────────────
    op.execute("""
        CREATE INDEX IF NOT EXISTS checkpoints_thread_id_idx
            ON checkpoints(thread_id)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS checkpoint_blobs_thread_id_idx
            ON checkpoint_blobs(thread_id)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS checkpoint_writes_thread_id_idx
            ON checkpoint_writes(thread_id)
    """)

    # ── Migration 9: task_path column ─────────────────────────────────────────
    # Đã baked vào CREATE TABLE checkpoint_writes ở trên.

    # ── Ghi version hiện tại vào checkpoint_migrations ───────────────────────
    # LangGraph sẽ đọc MAX(v) để biết không cần chạy lại migration nào.
    op.execute("""
        INSERT INTO checkpoint_migrations (v)
        SELECT gs.v
        FROM generate_series(0, 9) AS gs(v)
        WHERE NOT EXISTS (
            SELECT 1 FROM checkpoint_migrations WHERE v = gs.v
        )
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS checkpoint_writes_thread_id_idx")
    op.execute("DROP INDEX IF EXISTS checkpoint_blobs_thread_id_idx")
    op.execute("DROP INDEX IF EXISTS checkpoints_thread_id_idx")
    op.execute("DROP TABLE IF EXISTS checkpoint_writes")
    op.execute("DROP TABLE IF EXISTS checkpoint_blobs")
    op.execute("DROP TABLE IF EXISTS checkpoints")
    op.execute("DROP TABLE IF EXISTS checkpoint_migrations")
