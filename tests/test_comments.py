import uuid

from sqlmodel import Session

from app.models.user import User
from app.services.security import hash_password
from conftest import engine

BASE_TICKETS = "/api/tickets"
TEST_PASSWORD = "StrongPass123!"


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def unique_email(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}@example.com"


def create_user(client, name: str, email: str, password: str = TEST_PASSWORD):
    r = client.post(
        "/api/users",
        json={"name": name, "email": email, "password": password},
    )
    assert r.status_code in (200, 201), r.text
    return r.json()


def create_admin(name: str = "Admin", email: str | None = None, password: str = TEST_PASSWORD):
    email = email or unique_email("admin")
    with Session(engine) as session:
        admin = User(
            name=name,
            email=email,
            hashed_password=hash_password(password),
            is_admin=True,
        )
        session.add(admin)
        session.commit()
        session.refresh(admin)
        return admin, email


def login(client, email: str, password: str) -> str:
    r = client.post(
        "/api/users/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def create_ticket(client, token: str, description="D", request_type="software") -> int:
    r = client.post(
        f"{BASE_TICKETS}/",
        json={"description": description, "request_type": request_type},
        headers=auth_header(token),
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


def test_comment_endpoints_require_auth(client):
    r = client.get(f"{BASE_TICKETS}/1/comments")
    assert r.status_code == 401

    r = client.post(f"{BASE_TICKETS}/1/comments", json={"body": "x"})
    assert r.status_code == 401


def test_user_can_add_and_list_comments_on_own_ticket(client):
    email = unique_email("user")
    create_user(client, "U1", email)
    token = login(client, email, TEST_PASSWORD)
    tid = create_ticket(client, token, description="Printer Broken", request_type="hardware")

    r = client.post(
        f"{BASE_TICKETS}/{tid}/comments",
        json={"body": "first comment"},
        headers=auth_header(token),
    )
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["ticket_id"] == tid
    assert data["body"] == "first comment"
    assert data["author_name"] == "U1"

    r = client.get(f"{BASE_TICKETS}/{tid}/comments", headers=auth_header(token))
    assert r.status_code == 200, r.text
    comments = r.json()
    assert len(comments) == 1
    assert comments[0]["body"] == "first comment"
    assert comments[0]["author_name"] == "U1"


def test_user_cannot_list_or_add_comment_on_someone_elses_ticket(client):
    owner_email = unique_email("owner")
    other_email = unique_email("other")

    create_user(client, "Owner", owner_email)
    owner_token = login(client, owner_email, TEST_PASSWORD)
    tid = create_ticket(client, owner_token)

    create_user(client, "Other", other_email)
    other_token = login(client, other_email, TEST_PASSWORD)

    r = client.get(f"{BASE_TICKETS}/{tid}/comments", headers=auth_header(other_token))
    assert r.status_code == 403, r.text

    r = client.post(
        f"{BASE_TICKETS}/{tid}/comments",
        json={"body": "hijack"},
        headers=auth_header(other_token),
    )
    assert r.status_code == 403, r.text


def test_admin_can_add_and_list_comments_on_any_ticket(client):
    user_email = unique_email("user")
    create_user(client, "User", user_email)
    user_token = login(client, user_email, TEST_PASSWORD)
    tid = create_ticket(client, user_token)

    _, admin_email = create_admin()
    admin_token = login(client, admin_email, TEST_PASSWORD)

    r = client.post(
        f"{BASE_TICKETS}/{tid}/comments",
        json={"body": "admin note"},
        headers=auth_header(admin_token),
    )
    assert r.status_code == 201, r.text
    assert r.json()["author_name"] == "Admin"

    r = client.get(f"{BASE_TICKETS}/{tid}/comments", headers=auth_header(admin_token))
    assert r.status_code == 200, r.text
    assert any(c["body"] == "admin note" for c in r.json())


def test_comment_list_sorted_by_created_at(client):
    email = unique_email("owner")
    create_user(client, "Owner", email)
    token = login(client, email, TEST_PASSWORD)
    tid = create_ticket(client, token)

    client.post(
        f"{BASE_TICKETS}/{tid}/comments",
        json={"body": "c1"},
        headers=auth_header(token),
    )
    client.post(
        f"{BASE_TICKETS}/{tid}/comments",
        json={"body": "c2"},
        headers=auth_header(token),
    )

    r = client.get(f"{BASE_TICKETS}/{tid}/comments", headers=auth_header(token))
    assert r.status_code == 200, r.text
    assert [c["body"] for c in r.json()] == ["c1", "c2"]


def test_comment_endpoints_return_404_for_missing_ticket(client):
    email = unique_email("user")
    create_user(client, "U1", email)
    token = login(client, email, TEST_PASSWORD)

    r = client.get(f"{BASE_TICKETS}/9999/comments", headers=auth_header(token))
    assert r.status_code == 404

    r = client.post(
        f"{BASE_TICKETS}/9999/comments",
        json={"body": "x"},
        headers=auth_header(token),
    )
    assert r.status_code == 404
