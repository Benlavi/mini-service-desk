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


def create_user(client, name="U1", email="u1@example.com", password="StrongPass123!"):
    r = client.post(
        "/api/users",
        json={"name": name, "email": email, "password": password},
    )
    assert r.status_code == 201, r.text
    return email, password


def test_assist_form_requires_auth(client):
    r = client.post("/api/chat/assist-form", json={"message": "My laptop is slow"})
    assert r.status_code == 401


def test_assist_form_rejects_empty_message(client):
    email, password = create_user(client)
    token = login(client, email, password)
    r = client.post(
        "/api/chat/assist-form",
        json={"message": "   "},
        headers=auth_header(token),
    )
    assert r.status_code == 400


def test_assist_form_returns_structured_suggestion(client, monkeypatch):
    email, password = create_user(client)
    token = login(client, email, password)

    async def fake_status():
        return {"available": True, "model_ready": True}

    async def fake_suggest(_text: str):
        return {
            "description": "Issue: Excel crashes on open | Impact: Payroll blocked",
            "urgency": "high",
            "request_type": "software",
            "follow_up_questions": ["When did the issue start?"],
        }

    monkeypatch.setattr("app.routers.chat.check_ollama_status", fake_status)
    monkeypatch.setattr("app.routers.chat.suggest_ticket_from_text", fake_suggest)

    r = client.post(
        "/api/chat/assist-form",
        json={"message": "Excel keeps crashing and I cannot do payroll"},
        headers=auth_header(token),
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["request_type"] == "software"
    assert data["urgency"] == "high"
    assert "Issue:" in data["description"]
    assert len(data["follow_up_questions"]) == 1
