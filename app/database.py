import os
from sqlmodel import SQLModel, Session, create_engine

# Import all models to ensure tables are created
from app.models.user import User  # noqa: F401
from app.models.ticket import Ticket  # noqa: F401
from app.models.comment import TicketComment  # noqa: F401


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///database.db")
ENV = os.getenv("ENV", "dev")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

echo = ENV != "prod"

engine = create_engine(
    DATABASE_URL,
    echo=echo,
    connect_args=connect_args,
)


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
