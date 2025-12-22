import os
from sqlmodel import SQLModel, Session, create_engine

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///database.db")
ENV = os.getenv( "ENV" , "dev")


connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

if ENV == "prod":
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args=connect_args,
    )
if ENV == "dev":
        engine = create_engine(
        DATABASE_URL,
        echo=True,
        connect_args=connect_args,
    )

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session