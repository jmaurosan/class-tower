import requests
import uuid

BASE_URL = "http://localhost:3001"
HEADERS = {
    "Content-Type": "application/json",
    "x-function-secret": "supersecretkey"  # Replace with actual secret if known
}
TIMEOUT = 30

def test_user_management_create_new_user_with_role():
    user_id = None
    # Prepare a unique test user payload with role assignment
    test_user = {
        "email": f"testuser_{uuid.uuid4().hex[:8]}@example.com",
        "password": "TestPassword123!",
        "full_name": "Test User",
        "role": "operator"
    }

    # Create user via edge function "create-user"
    create_user_url = f"{BASE_URL}/edge-functions/create-user"
    # The PRD states edge functions named create-user and keep-alive exist and require x-function-secret

    try:
        # Call create-user function
        response = requests.post(create_user_url, json=test_user, headers=HEADERS, timeout=TIMEOUT)
        assert response.status_code == 201, f"Create user failed: {response.text}"

        created_user = response.json()
        assert "id" in created_user, "Response missing user id"
        user_id = created_user["id"]
        assert created_user.get("email") == test_user["email"], "Email mismatch in created user"
        assert created_user.get("role") == test_user["role"], "Role mismatch in created user"

        # Verify user appears in user list
        list_users_url = f"{BASE_URL}/edge-functions/list-users"
        # Assuming there's an edge-function or API to list users; if none specified, use profiles endpoint
        # The PRD mentions profiles endpoint (SELECT) and edge functions for logic
        # We will call /edge-functions/list-users with secret header as well

        list_response = requests.get(list_users_url, headers=HEADERS, timeout=TIMEOUT)
        assert list_response.status_code == 200, f"User list fetch failed: {list_response.text}"
        users = list_response.json()
        assert any(u.get("id") == user_id for u in users), "Created user not found in user list"

        # Call keep-alive function to validate security and that secret is accepted
        keep_alive_url = f"{BASE_URL}/edge-functions/keep-alive"
        keep_alive_resp = requests.get(keep_alive_url, headers=HEADERS, timeout=TIMEOUT)
        assert keep_alive_resp.status_code == 200, "Keep-alive function failed or secret not accepted"

    finally:
        # Cleanup: delete created user using direct API or edge function if available
        if user_id:
            delete_user_url = f"{BASE_URL}/edge-functions/delete-user"
            # If delete-user edge function exists; if not, delete via profiles with secret
            # Since no delete-user endpoint specified, attempt delete via profiles endpoint (DELETE request)
            try:
                del_resp = requests.delete(f"{BASE_URL}/profiles/{user_id}", headers=HEADERS, timeout=TIMEOUT)
                # Some Supabase setups might not allow direct DELETE, so ignore failure here
                if del_resp.status_code not in (200, 204):
                    # Try delete-user edge function if it existed; otherwise pass
                    pass
            except requests.RequestException:
                pass

test_user_management_create_new_user_with_role()