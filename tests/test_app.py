import urllib.parse

from src.app import activities


def test_get_activities(client):
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister(client):
    activity = "Chess Club"
    email = "test_student@example.com"

    # Signup the test student
    quoted = urllib.parse.quote(activity, safe="")
    resp = client.post(f"/activities/{quoted}/signup", params={"email": email})
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]

    # Unregister the test student
    resp = client.delete(f"/activities/{quoted}/participants", params={"email": email})
    assert resp.status_code == 200
    assert email not in activities[activity]["participants"]


def test_delete_nonexistent_participant_returns_404(client):
    activity = "Programming Class"
    email = "nonexistent_user@example.com"
    quoted = urllib.parse.quote(activity, safe="")
    resp = client.delete(f"/activities/{quoted}/participants", params={"email": email})
    assert resp.status_code == 404
