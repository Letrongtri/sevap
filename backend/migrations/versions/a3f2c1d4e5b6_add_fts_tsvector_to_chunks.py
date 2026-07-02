"""add fts tsvector to document_chunks

Revision ID: a3f2c1d4e5b6
Revises: dfa1bd0369b1
Create Date: 2026-07-02 20:33:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f2c1d4e5b6'
down_revision: Union[str, Sequence[str], None] = '5dcb39963faf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    1. Enable unaccent extension (idempotent).
    2. Drop unused context_content column.
    3. Add content_tsv as a GENERATED ALWAYS STORED tsvector column.
    4. Create GIN index for fast full-text search.
    """
    # 1. Enable unaccent extension
    op.execute("CREATE EXTENSION IF NOT EXISTS unaccent;")

    # 2. Drop unused column
    op.drop_column('document_chunks', 'context_content')

    # 3. Tạo immutable wrapper cho unaccent
    #    PostgreSQL yêu cầu GENERATED ALWAYS AS expression phải IMMUTABLE.
    #    unaccent() mặc định là STABLE, nên cần wrapper để bỏ qua hạn chế này.
    op.execute("""
        CREATE OR REPLACE FUNCTION immutable_unaccent(text)
        RETURNS text AS $$
            SELECT unaccent($1)
        $$ LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE;
    """)

    # 4. Add generated tsvector column
    #    GENERATED ALWAYS AS ... STORED: PostgreSQL tự cập nhật khi INSERT/UPDATE
    op.execute("""
        ALTER TABLE document_chunks
        ADD COLUMN content_tsv tsvector
        GENERATED ALWAYS AS (
            to_tsvector('simple', immutable_unaccent(content))
        ) STORED;
    """)


    # 4. GIN index để FTS nhanh
    op.execute("""
        CREATE INDEX idx_document_chunks_content_tsv
        ON document_chunks USING GIN (content_tsv);
    """)


def downgrade() -> None:
    """Reverse: xóa GIN index, xóa content_tsv, khôi phục context_content."""
    op.execute("DROP INDEX IF EXISTS idx_document_chunks_content_tsv;")

    op.execute("ALTER TABLE document_chunks DROP COLUMN IF EXISTS content_tsv;")

    op.add_column(
        'document_chunks',
        sa.Column('context_content', sa.Text(), nullable=True)
    )
