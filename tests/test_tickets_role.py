import uuid

from sqlmodel import Session

from app.models.user import User
from app.services.security import hash_password
from conftest import engine

BASE = "/api/tickets"

TEST_PASSWORD = "TestPass123!"


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def unique_email(prefix="user") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}@example.com"


def create_user(client, name, email=None, password=TEST_PASSWORD):
    if email is None:
        email = unique_email("user")

    payload = {"name": name, "email": email, "password": password}
    r = client.post("/api/users", json=payload)
    assert r.status_code in (200, 201), r.text
    return r.json(), email


def create_admin(name="Admin", email=None, password=TEST_PASSWORD):
    if email is None:
        email = unique_email("admin")

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


def login(client, email, password) -> str:
    r = client.post(
        "/api/users/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def test_user_cant_patch_status_or_operator(client):
    _, email = create_user(client, "U1", password=TEST_PASSWORD)
    token = login(client, email, TEST_PASSWORD)

    r = client.post(
        f"{BASE}/",
        json={"description": "Issue A", "request_type": "software"},
        headers=auth_header(token),
    )
    assert r.status_code == 201, r.text
    tid = r.json()["id"]

    r = client.patch(
        f"{BASE}/{tid}",
        json={"status": "pending", "operator_id": 999, "urgency": "high"},
        headers=auth_header(token),
    )
    assert r.status_code == 200, r.text
    body = r.json()

    assert body["status"] == "new"
    assert body["urgency"] == "normal"
    assert body["operator_id"] is None

    r = client.patch(
        f"{BASE}/{tid}",
        json={"description": "Updated description"},
        headers=auth_header(token),
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["description"] == "Updated description"


def test_non_admin_cannot_delete_ticket(client):
    _, email = create_user(client, "U1")
    token = login(client, email, TEST_PASSWORD)

    r = client.post(
        f"{BASE}/",
        json={"description": "Issue A", "request_type": "software"},
        headers=auth_header(token),
    )
    tid = r.json()["id"]

    r = client.delete(f"{BASE}/{tid}", headers=auth_header(token))
    assert r.status_code == 403, r.text


def test_admin_can_delete_ticket(client):
    _, owner_email = create_user(client, "Owner")
    owner_token = login(client, owner_email, TEST_PASSWORD)
    r = client.post(
        f"{BASE}/",
        json={"description": "Delete me", "request_type": "software"},
        headers=auth_header(owner_token),
    )
    tid = r.json()["id"]

    _, admin_email = create_admin()
    admin_token = login(client, admin_email, TEST_PASSWORD)

    r = client.delete(f"{BASE}/{tid}", headers=auth_header(admin_token))
    assert r.status_code == 204, r.text

    r = client.get(f"{BASE}/{tid}", headers=auth_header(admin_token))
    assert r.status_code == 404


def test_assigned_status_requires_operator(client):
    _, owner_email = create_user(client, "Owner")
    owner_token = login(client, owner_email, TEST_PASSWORD)
    r = client.post(
        f"{BASE}/",
        json={"description": "Issue A", "request_type": "software"},
        headers=auth_header(owner_token),
    )
    tid = r.json()["id"]

    _, admin_email = create_admin()
    admin_token = login(client, admin_email, TEST_PASSWORD)

    r = client.patch(
        f"{BASE}/{tid}",
        json={"status": "assigned"},
        headers=auth_header(admin_token),
    )
    assert r.status_code == 400
    assert "requires an operator" in r.json()["detail"]


def test_new_status_cannot_have_operator(client):
    _, owner_email = create_user(client, "Owner")
    owner_token = login(client, owner_email, TEST_PASSWORD)
    r = client.post(
        f"{BASE}/",
        json={"description": "Issue A", "request_type": "software"},
        headers=auth_header(owner_token),
    )
    tid = r.json()["id"]

    admin, admin_email = create_admin()
    admin_token = login(client, admin_email, TEST_PASSWORD)

    r = client.patch(
        f"{BASE}/{tid}",
        json={"status": "new", "operator_id": admin.id},
        headers=auth_header(admin_token),
    )
    assert r.status_code == 400
    assert "cannot have an operator" in r.json()["detail"]


def test_operator_assignment_auto_sets_status_to_assigned(client):
    _, owner_email = create_user(client, "Owner")
    owner_token = login(client, owner_email, TEST_PASSWORD)
    r = client.post(
        f"{BASE}/",
        json={"description": "Issue A", "request_type": "software"},
        headers=auth_header(owner_token),
    )
    tid = r.json()["id"]

    admin, admin_email = create_admin()
    admin_token = login(client, admin_email, TEST_PASSWORD)

    r = client.patch(
        f"{BASE}/{tid}",
        json={"operator_id": admin.id},
        headers=auth_header(admin_token),
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["operator_id"] == admin.id
    assert body["status"] == "assigned"
