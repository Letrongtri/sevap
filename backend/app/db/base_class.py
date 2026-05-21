from sqlalchemy.orm import declarative_base

# Lớp cơ sở để các models kế thừa, giúp Alembic nhận diện lược đồ (schema)
Base = declarative_base()