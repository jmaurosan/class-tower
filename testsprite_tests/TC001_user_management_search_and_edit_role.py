import requests
import uuid

BASE_URL = "http://localhost:3001"
HEADERS = {
    "Content-Type": "application/json",
    # Assuming x-function-secret is required for Edge Functions
    "x-function-secret": "test-secret"
}
TIMEOUT = 30


def test_user_management_search_and_edit_role():
    new_user = {
        "name": "Test User " + str(uuid.uuid4()),
        "email": f"testuser_{uuid.uuid4().hex[:8]}@example.com",
        "unit": "Unit Test",
        "role": "user"
    }
    created_user_id = None

    # Create user via POST to /profiles as per PRD
    try:
        create_resp = requests.post(
            f"{BASE_URL}/profiles",
            headers=HEADERS,
            json=new_user,
            timeout=TIMEOUT,
        )
        assert create_resp.status_code in [200, 201], f"Create user failed with status {create_resp.status_code}: {create_resp.text}"
        create_data = create_resp.json()
        created_user_id = create_data.get("id")
        assert created_user_id is not None, "Created user ID is missing"

        # Keep alive edge function call as part of test validations
        keep_alive_resp = requests.post(
            f"{BASE_URL}/keep-alive",
            headers=HEADERS,
            timeout=TIMEOUT,
        )
        assert keep_alive_resp.status_code == 200, f"Keep-alive failed: {keep_alive_resp.text}"

        # Search user by name
        search_params_name = {"name": new_user["name"]}
        search_resp_name = requests.get(
            f"{BASE_URL}/profiles",
            headers=HEADERS,
            params=search_params_name,
            timeout=TIMEOUT,
        )
        assert search_resp_name.status_code == 200, f"Search by name failed: {search_resp_name.text}"
        users_found_name = search_resp_name.json()
        assert any(u["id"] == created_user_id for u in users_found_name), "Created user not found by name"

        # Search user by unit
        search_params_unit = {"unit": new_user["unit"]}
        search_resp_unit = requests.get(
            f"{BASE_URL}/profiles",
            headers=HEADERS,
            params=search_params_unit,
            timeout=TIMEOUT,
        )
        assert search_resp_unit.status_code == 200, f"Search by unit failed: {search_resp_unit.text}"
        users_found_unit = search_resp_unit.json()
        assert any(u["id"] == created_user_id for u in users_found_unit), "Created user not found by unit"

        # Edit user's role
        updated_role = "admin"
        update_payload = {"role": updated_role}
        update_resp = requests.put(
            f"{BASE_URL}/profiles/{created_user_id}",
            headers=HEADERS,
            json=update_payload,
            timeout=TIMEOUT,
        )
        assert update_resp.status_code == 200, f"Update role failed: {update_resp.text}"
        updated_user = update_resp.json()
        assert updated_user.get("role") == updated_role, "Role not updated correctly"

        # Verify updated role reflected in user list (search again by name)
        verify_resp = requests.get(
            f"{BASE_URL}/profiles",
            headers=HEADERS,
            params={"name": new_user["name"]},
            timeout=TIMEOUT,
        )
        assert verify_resp.status_code == 200, f"Verify search failed: {verify_resp.text}"
        users_after_update = verify_resp.json()
        matching_user = next((u for u in users_after_update if u["id"] == created_user_id), None)
        assert matching_user is not None, "Updated user not found in search after role update"
        assert matching_user.get("role") == updated_role, "Updated role not reflected in user list"

    finally:
        # Cleanup: delete created user to maintain test isolation
        if created_user_id:
            try:
                delete_resp = requests.delete(
                    f"{BASE_URL}/profiles/{created_user_id}",
                    headers=HEADERS,
                    timeout=TIMEOUT,
                )
            except Exception:
                pass


test_user_management_search_and_edit_role()
