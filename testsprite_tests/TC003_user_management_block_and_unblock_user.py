import requests
import uuid

BASE_URL = "http://localhost:3001"
HEADERS = {
    "x-function-secret": "your_secret_key_here",  # Replace with actual secret key
    "Content-Type": "application/json"
}
TIMEOUT = 30

def test_user_management_block_and_unblock_user():
    # Step 1: Create a new user with required fields
    create_user_url = f"{BASE_URL}/profiles"
    new_user_payload = {
        "email": f"testuser_{uuid.uuid4().hex[:8]}@example.com",
        "full_name": "Test User Block Unblock",
        "role": "user"
    }

    user_id = None
    try:
        # Create user
        response = requests.post(create_user_url, json=new_user_payload, headers=HEADERS, timeout=TIMEOUT)
        assert response.status_code in (200,201), f"User creation failed: {response.text}"
        created_users = response.json()
        # Since single object returned, wrap as list if needed
        if isinstance(created_users, dict):
            created_users = [created_users]
        assert isinstance(created_users, list) and len(created_users) == 1, "User creation response malformed"
        user_id = created_users[0].get("id")
        assert user_id, "Created user ID not returned"

        # Verify user created with status 'Active' or similar
        get_profile_url = f"{BASE_URL}/profiles?id=eq.{user_id}"
        get_response = requests.get(get_profile_url, headers=HEADERS, timeout=TIMEOUT)
        assert get_response.status_code == 200, f"Get profile failed: {get_response.text}"
        profile = get_response.json()
        assert isinstance(profile, list) and len(profile) == 1, "User profile not found after creation"

        initial_status = profile[0].get("status")
        assert initial_status != "Blocked", "User initial status unexpectedly 'Blocked'"

        # Step 2: Block the user using update endpoint (PATCH to profiles)
        update_profile_url = f"{BASE_URL}/profiles?id=eq.{user_id}"
        block_payload = {"status": "Blocked"}

        block_response = requests.patch(update_profile_url, json=block_payload, headers=HEADERS, timeout=TIMEOUT)
        assert block_response.status_code == 204, f"Block user failed: {block_response.text}"

        # Confirm status changed to 'Blocked'
        get_blocked_response = requests.get(get_profile_url, headers=HEADERS, timeout=TIMEOUT)
        assert get_blocked_response.status_code == 200, f"Get profile after block failed: {get_blocked_response.text}"
        blocked_profile = get_blocked_response.json()
        assert blocked_profile[0].get("status") == "Blocked", "User status not 'Blocked' after blocking"

        # Step 3: Unblock the user (set status back to previous or 'Active')
        unblock_payload = {"status": initial_status or "Active"}
        unblock_response = requests.patch(update_profile_url, json=unblock_payload, headers=HEADERS, timeout=TIMEOUT)
        assert unblock_response.status_code == 204, f"Unblock user failed: {unblock_response.text}"

        # Confirm status reverted
        get_unblock_response = requests.get(get_profile_url, headers=HEADERS, timeout=TIMEOUT)
        assert get_unblock_response.status_code == 200, f"Get profile after unblock failed: {get_unblock_response.text}"
        unblocked_profile = get_unblock_response.json()
        assert unblocked_profile[0].get("status") == (initial_status or "Active"), "User status not reverted after unblocking"

    finally:
        # Clean up: Delete the created user using DELETE if endpoint exists
        if user_id:
            delete_url = f"{BASE_URL}/profiles?id=eq.{user_id}"
            requests.delete(delete_url, headers=HEADERS, timeout=TIMEOUT)

test_user_management_block_and_unblock_user()