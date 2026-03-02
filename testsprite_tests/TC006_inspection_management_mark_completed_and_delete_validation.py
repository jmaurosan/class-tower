import requests
import uuid

BASE_URL = "http://localhost:3001"
TIMEOUT = 30
# Assuming the API requires authentication headers - since instructions mention security and Supabase backend:
# Adjust or add auth headers as needed here.
HEADERS = {
    "Content-Type": "application/json",
    # Include auth token and function secret as required by backend security.
    # "Authorization": "Bearer <your_token>",
    # "x-function-secret": "<your_function_secret>",
}

def create_inspection():
    """Create a new inspection to test with."""
    inspection_data = {
        "title": "Test Inspection " + str(uuid.uuid4()),
        "description": "Test description",
        "status": "Pending",
        "photos": ["http://example.com/photo1.jpg"],  # Assuming photos are URLs or references
    }
    response = requests.post(
        f"{BASE_URL}/vistorias",
        json=inspection_data,
        headers=HEADERS,
        timeout=TIMEOUT
    )
    response.raise_for_status()
    return response.json()  # Expect to get created inspection object with id

def mark_inspection_completed(inspection_id):
    """Mark the inspection as completed."""
    payload = {
        "status": "Completed"
    }
    response = requests.put(
        f"{BASE_URL}/vistorias/{inspection_id}/complete",
        json=payload,
        headers=HEADERS,
        timeout=TIMEOUT
    )
    return response

def delete_inspection(inspection_id, reason=None):
    """Delete inspection; reason required for deletion."""
    payload = {}
    if reason is not None:
        payload["reason"] = reason
    response = requests.delete(
        f"{BASE_URL}/vistorias/{inspection_id}",
        json=payload if payload else None,
        headers=HEADERS,
        timeout=TIMEOUT
    )
    return response

def test_inspection_management_mark_completed_and_delete_validation():
    inspection = None
    try:
        # Step 1: Create inspection to work with
        inspection = create_inspection()
        inspection_id = inspection.get("id")
        assert inspection_id, "Created inspection must have an ID"

        # Step 2: Mark inspection as completed
        complete_resp = mark_inspection_completed(inspection_id)
        assert complete_resp.status_code == 200, f"Mark completed failed: {complete_resp.text}"
        completed_data = complete_resp.json()
        assert completed_data.get("status") == "Completed", "Inspection status not updated to Completed"

        # Step 3: Attempt to delete inspection without reason - expect validation error
        delete_resp_no_reason = delete_inspection(inspection_id)
        # Assuming 400 Bad Request or similar on validation error
        assert delete_resp_no_reason.status_code == 400, "Deleting without reason should fail validation"
        error_data = delete_resp_no_reason.json()
        # Validation error message expected to contain reason message
        assert "reason" in error_data.get("errors", {}) or "reason" in error_data.get("message", "").lower(), \
            "Validation error for missing deletion reason not returned"

        # Step 4: Delete inspection with a valid reason - should succeed
        delete_resp_with_reason = delete_inspection(inspection_id, reason="Test cleanup")
        assert delete_resp_with_reason.status_code in (200, 204), "Inspection deletion with reason failed"

        # Optionally verify deletion by trying to get the inspection and expecting 404
        get_resp = requests.get(
            f"{BASE_URL}/vistorias/{inspection_id}",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert get_resp.status_code == 404, "Inspection should be deleted and not found"

    finally:
        # Cleanup in case test fails before deletion
        if inspection:
            # Try deleting with reason to cleanup if still exists
            requests.delete(
                f"{BASE_URL}/vistorias/{inspection.get('id')}",
                json={"reason": "Test forced cleanup"},
                headers=HEADERS,
                timeout=TIMEOUT
            )

test_inspection_management_mark_completed_and_delete_validation()