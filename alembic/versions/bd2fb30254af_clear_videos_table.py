"""clear_videos_table

Revision ID: xxx
Revises: 13219d89f5dd
Create Date: [current_timestamp]
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'xxx'  # This will be auto-generated
down_revision: Union[str, None] = '13219d89f5dd'  # Your previous migration
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Delete all records from videos table
    op.execute('DELETE FROM videos')


def downgrade() -> None:
    # Cannot restore deleted data
    pass 