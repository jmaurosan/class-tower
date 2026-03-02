import requests
import uuid

BASE_URL = "http://localhost:3001"

HEADERS = {
    "Content-Type": "application/json"
}

def create_user():
    url = f"{BASE_URL}/profiles"
    user_data = {
        "email": f"testuser_{uuid.uuid4().hex[:8]}@example.com",
        "full_name": "Test User",
        "role": "user"
    }
    response = requests.post(url, json=user_data, headers=HEADERS, timeout=30)
    response.raise_for_status()
    return response.json()["id"]

def delete_user(user_id, reason=None):
    url = f"{BASE_URL}/profiles/{user_id}"
    if reason is None:
        payload = {}
    else:
        payload = {"deletion_reason": reason}
    response = requests.patch(url, json=payload, headers=HEADERS, timeout=30)
    return response

def test_user_management_delete_user_with_reason_validation():
    user_id = None
    try:
        user_id = create_user()
        
        response_missing_reason = delete_user(user_id, reason=None)
        assert response_missing_reason.status_code in (400, 422), \
            f"Expected 400 or 422 status code for missing reason, got {response_missing_reason.status_code}"
        json_resp = response_missing_reason.json()
        errors = json_resp.get("errors", {})
        message = json_resp.get("message", "")
        assert ("reason" in errors or "deletion_reason" in errors or 
                "Reason is required" in message or "reason" in message.lower()), \
            "Validation error for missing deletion reason not found in response"

        valid_reason = "User requested account deletion"
        response_with_reason = delete_user(user_id, reason=valid_reason)
        assert response_with_reason.status_code in (200, 204), \
            f"Expected successful deletion status (200 or 204), got {response_with_reason.status_code}"

    finally:
        if user_id is not None:
            _ = delete_user(user_id, reason="Cleanup after test")

test_user_management_delete_user_with_reason_validation()
