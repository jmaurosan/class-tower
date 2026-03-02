import requests
import base64
import json

BASE_URL = "http://localhost:3001"
HEADERS = {
    "Content-Type": "application/json",
    # Assuming authentication via Authorization Bearer token is required
    # Replace 'your_auth_token_here' with a valid token for testing
    "Authorization": "Bearer your_auth_token_here"
}
TIMEOUT = 30

def test_inspection_management_register_and_edit_inspection():
    inspection_id = None
    audit_log_endpoint = f"{BASE_URL}/audit-logs"
    vistorias_endpoint = f"{BASE_URL}/vistorias"

    # Sample inspection payload for creation
    new_inspection_payload = {
        "title": "Test Inspection",
        "description": "Initial test inspection description",
        "location": "Building A - Floor 3",
        "status": "Pending",
        # Simulated base64 photo (1x1 pixel PNG transparent)
        "photo": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBASmfI2MAAAAASUVORK5CYII=",
        "timestamp": "2026-02-21T10:00:00Z"
    }

    try:
        # Create new inspection (POST)
        response = requests.post(
            vistorias_endpoint,
            headers=HEADERS,
            data=json.dumps(new_inspection_payload),
            timeout=TIMEOUT
        )
        assert response.status_code == 201, f"Expected 201 Created, got {response.status_code}"
        data = response.json()
        assert "id" in data, "Response missing inspection ID"
        inspection_id = data["id"]

        # Verify created data matches sent data (title, description, status)
        for key in ["title", "description", "status", "location"]:
            assert data.get(key) == new_inspection_payload[key], f"Mismatch in field {key}"

        # Edit existing inspection fields (PUT)
        updated_payload = {
            "title": "Test Inspection Edited",
            "description": "Edited inspection description with updates",
            "location": "Building A - Floor 4",
            "status": "In Progress"
        }
        edit_response = requests.put(
            f"{vistorias_endpoint}/{inspection_id}",
            headers=HEADERS,
            data=json.dumps(updated_payload),
            timeout=TIMEOUT
        )
        assert edit_response.status_code == 200, f"Expected 200 OK on edit, got {edit_response.status_code}"
        updated_data = edit_response.json()
        for key, value in updated_payload.items():
            assert updated_data.get(key) == value, f"Field {key} not updated correctly"

        # Verify audit entries are recorded for this inspection update
        # We assume audit logs can be filtered by table and record id
        params = {
            "table": "vistorias",
            "record_id": inspection_id,
            "action": "UPDATE"
        }
        audit_response = requests.get(
            audit_log_endpoint,
            headers=HEADERS,
            params=params,
            timeout=TIMEOUT
        )
        assert audit_response.status_code == 200, f"Expected 200 OK audit logs, got {audit_response.status_code}"
        audit_logs = audit_response.json()
        assert isinstance(audit_logs, list), "Audit logs response should be a list"
        assert len(audit_logs) > 0, "No audit logs found for update action on inspection"

        # Check audit log entries contain required fields
        for entry in audit_logs:
            assert entry.get("table") == "vistorias", "Audit log entry has wrong table"
            assert entry.get("record_id") == inspection_id, "Audit log entry has wrong record_id"
            assert entry.get("action") == "UPDATE", "Audit log entry action is not UPDATE"
            assert "user" in entry, "Audit log entry missing user info"
            # Optional: Check before and after fields presence
            assert "before" in entry and "after" in entry, "Audit log entry missing before/after data"

    finally:
        # Cleanup: delete the created inspection if exists
        if inspection_id:
            del_response = requests.delete(
                f"{vistorias_endpoint}/{inspection_id}",
                headers=HEADERS,
                timeout=TIMEOUT
            )
            assert del_response.status_code in [200, 204], "Failed to delete inspection in cleanup"

test_inspection_management_register_and_edit_inspection()