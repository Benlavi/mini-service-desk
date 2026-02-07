"""Security-focused tests for the mini-service-desk backend."""

import uuid

from sqlmodel import Session

from app.models.user import User
from app.services.security import hash_password
from conftest import engine


def unique_email(prefix: str = "user") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}@example.com"


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def login(client, email, password) -> str:
    r = client.post(
        "/api/users/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def create_admin(name="Admin", email=None, password="StrongPass123!"):
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


class TestPrivilegeEscalation:
    """Test that users cannot escalate their own privileges."""

    def test_user_cannot_register_as_admin(self, client):
        """Verify is_admin is ignored when registering."""
        r = client.post(
            "/api/users",
            json={
                "name": "Attacker",
                "email": "attacker@example.com",
                "password": "StrongPass123!",
                "is_admin": True,  # Should be ignored
            },
        )
        assert r.status_code == 201
        user_data = r.json()
        assert user_data["is_admin"] is False, (
            "Users should not be able to self-promote to admin"
        )


class TestPasswordValidation:
    """Test password strength requirements."""

    def test_password_too_short(self, client):
        """Passwords under 8 characters should be rejected."""
        r = client.post(
            "/api/users",
            json={"name": "Test", "email": "test1@example.com", "password": "Aa1!"},
        )
        assert r.status_code == 400
        assert "8 characters" in r.json()["detail"]

    def test_password_missing_uppercase(self, client):
        """Passwords without uppercase should be rejected."""
        r = client.post(
            "/api/users",
            json={
                "name": "Test",
                "email": "test2@example.com",
                "password": "password1!",
            },
        )
        assert r.status_code == 400
        assert "uppercase" in r.json()["detail"]

    def test_password_missing_lowercase(self, client):
        """Passwords without lowercase should be rejected."""
        r = client.post(
            "/api/users",
            json={
                "name": "Test",
                "email": "test3@example.com",
                "password": "PASSWORD1!",
            },
        )
        assert r.status_code == 400
        assert "lowercase" in r.json()["detail"]

    def test_password_missing_number(self, client):
        """Passwords without numbers should be rejected."""
        r = client.post(
            "/api/users",
            json={
                "name": "Test",
                "email": "test4@example.com",
                "password": "Password!",
            },
        )
        assert r.status_code == 400
        assert "number" in r.json()["detail"]

    def test_password_missing_symbol(self, client):
        """Passwords without symbols should be rejected."""
        r = client.post(
            "/api/users",
            json={
                "name": "Test",
                "email": "test5@example.com",
                "password": "Password1",
            },
        )
        assert r.status_code == 400
        assert "symbol" in r.json()["detail"]

    def test_strong_password_accepted(self, client):
        """Valid strong passwords should be accepted."""
        email = unique_email("valid")
        r = client.post(
            "/api/users",
            json={
                "name": "Test",
                "email": email,
                "password": "StrongPass123!",
            },
        )
        assert r.status_code == 201

    def test_duplicate_email_rejected(self, client):
        email = unique_email("dup")
        r = client.post(
            "/api/users",
            json={"name": "U1", "email": email, "password": "StrongPass123!"},
        )
        assert r.status_code == 201

        r = client.post(
            "/api/users",
            json={"name": "U2", "email": email, "password": "StrongPass123!"},
        )
        assert r.status_code == 400
        assert "already exists" in r.json()["detail"].lower()


class TestAuthenticationRequired:
    """Test that protected endpoints require authentication."""

    def test_user_lookup_requires_auth(self, client):
        """GET /api/users/{id} should require authentication."""
        r = client.get("/api/users/1")
        assert r.status_code == 401

    def test_tickets_list_requires_auth(self, client):
        """GET /api/tickets should require authentication."""
        r = client.get("/api/tickets/")
        assert r.status_code == 401


class TestSecurityHeaders:
    """Test that security headers are present."""

    def test_security_headers_present(self, client):
        """Response should include security headers."""
        r = client.get("/")
        assert r.headers.get("X-Content-Type-Options") == "nosniff"
        assert r.headers.get("X-Frame-Options") == "DENY"
        assert r.headers.get("X-XSS-Protection") == "1; mode=block"


class TestTokenValidation:
    """Test JWT token validation - Session 11 requirement."""

    def test_expired_token_rejected(self, client):
        """Expired tokens should be rejected with 401."""
        # This is a token with exp in the past (crafted for testing)
        expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNjAwMDAwMDAwfQ.invalid"
        r = client.get("/api/tickets/", headers=auth_header(expired_token))
        assert r.status_code == 401
        assert "credentials" in r.json()["detail"].lower()

    def test_invalid_token_rejected(self, client):
        """Malformed tokens should be rejected with 401."""
        r = client.get("/api/tickets/", headers=auth_header("not.a.valid.token"))
        assert r.status_code == 401

    def test_missing_token_rejected(self, client):
        """Requests without tokens should be rejected with 401."""
        r = client.get("/api/tickets/")
        assert r.status_code == 401


class TestLoginSecurity:
    def test_login_wrong_password_rejected(self, client):
        email = unique_email("login")
        client.post(
            "/api/users",
            json={"name": "User", "email": email, "password": "StrongPass123!"},
        )
        r = client.post(
            "/api/users/login",
            data={"username": email, "password": "WrongPass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert r.status_code == 401

    def test_login_rate_limited_after_five_attempts(self, client):
        for _ in range(5):
            r = client.post(
                "/api/users/login",
                data={"username": "nobody@example.com", "password": "WrongPass123!"},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            assert r.status_code == 401

        r = client.post(
            "/api/users/login",
            data={"username": "nobody@example.com", "password": "WrongPass123!"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert r.status_code == 429

    def test_register_rate_limited_after_three_attempts(self, client):
        for i in range(3):
            r = client.post(
                "/api/users",
                json={
                    "name": f"U{i}",
                    "email": unique_email("rate"),
                    "password": "StrongPass123!",
                },
            )
            assert r.status_code == 201

        r = client.post(
            "/api/users",
            json={
                "name": "U4",
                "email": unique_email("rate"),
                "password": "StrongPass123!",
            },
        )
        assert r.status_code == 429


class TestCSVExport:
    """Test CSV export endpoint - EX3 enhancement."""

    def test_export_requires_auth(self, client):
        """Export endpoint requires authentication."""
        r = client.get("/api/export/tickets")
        assert r.status_code == 401

    def test_export_returns_csv(self, client):
        """Authenticated users can export their tickets as CSV."""
        # Create a user and get token
        email = unique_email("exporter")
        client.post(
            "/api/users",
            json={
                "name": "Exporter",
                "email": email,
                "password": "StrongPass123!",
            },
        )
        token = login(client, email, "StrongPass123!")

        # Create a ticket
        client.post(
            "/api/tickets/",
            json={"description": "Test ticket", "request_type": "software"},
            headers=auth_header(token),
        )

        # Export tickets
        r = client.get("/api/export/tickets", headers=auth_header(token))
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        assert "attachment" in r.headers.get("content-disposition", "")
        assert "Test ticket" in r.text

    def test_export_returns_404_when_user_has_no_tickets(self, client):
        email = unique_email("empty-export")
        client.post(
            "/api/users",
            json={"name": "NoTicket", "email": email, "password": "StrongPass123!"},
        )
        token = login(client, email, "StrongPass123!")

        r = client.get("/api/export/tickets", headers=auth_header(token))
        assert r.status_code == 404

    def test_admin_export_includes_other_users_tickets(self, client):
        user_email = unique_email("user")
        client.post(
            "/api/users",
            json={
                "name": "User",
                "email": user_email,
                "password": "StrongPass123!",
            },
        )
        user_token = login(client, user_email, "StrongPass123!")
        client.post(
            "/api/tickets/",
            json={"description": "Owned by user", "request_type": "software"},
            headers=auth_header(user_token),
        )

        _, admin_email = create_admin()
        admin_token = login(client, admin_email, "StrongPass123!")

        r = client.get("/api/export/tickets", headers=auth_header(admin_token))
        assert r.status_code == 200, r.text
        assert "Owned by user" in r.text
