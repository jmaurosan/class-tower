
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** ClassTower-UI-Test-with-Data-Creation
- **Date:** 2026-03-02
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Edit an existing user's role and verify the updated role appears in the list
- **Test Code:** [TC001_Edit_an_existing_users_role_and_verify_the_updated_role_appears_in_the_list.py](./TC001_Edit_an_existing_users_role_and_verify_the_updated_role_appears_in_the_list.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Vistoria creation UI not available: 'Nova Vistoria' modal did not open and creation clicks failed or were not interactable.
- User search for 'Apto' did not return any visible user row in the results, so no user could be selected for editing.
- Could not open the user edit modal: Edit button clicks failed or elements were stale/uninteractable.
- Test data creation (Vistoria, Aviso, Encomenda) was not performed: 0 out of 3 created.
- Page rendering issues prevented further actions: final state showed 0 interactive elements, blocking completion of the test.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/522eabc3-c760-4633-9a1d-a8072983a91f/f3e47376-a669-4d27-9a33-e0c53c5675c3
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Create a new user with a specific role and verify it appears in the list
- **Test Code:** [TC002_Create_a_new_user_with_a_specific_role_and_verify_it_appears_in_the_list.py](./TC002_Create_a_new_user_with_a_specific_role_and_verify_it_appears_in_the_list.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/522eabc3-c760-4633-9a1d-a8072983a91f/689a2e9f-daaa-45ab-90aa-bc1e1be0706e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Block a user and verify the status shows Blocked
- **Test Code:** [TC003_Block_a_user_and_verify_the_status_shows_Blocked.py](./TC003_Block_a_user_and_verify_the_status_shows_Blocked.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/522eabc3-c760-4633-9a1d-a8072983a91f/6d6afb43-a2e8-4034-8b4b-78d65ee86c7a
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Non-admin user sees insufficient permissions on User Management page
- **Test Code:** [TC004_Non_admin_user_sees_insufficient_permissions_on_User_Management_page.py](./TC004_Non_admin_user_sees_insufficient_permissions_on_User_Management_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/522eabc3-c760-4633-9a1d-a8072983a91f/3638acc5-5581-4eb6-a93c-f6fc4c89435f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Delete user validation: reason is required
- **Test Code:** [TC005_Delete_user_validation_reason_is_required.py](./TC005_Delete_user_validation_reason_is_required.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/522eabc3-c760-4633-9a1d-a8072983a91f/4c08eff6-6f7c-446e-942f-63b3c228909f
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Create a new inspection and verify it appears in the inspections list
- **Test Code:** [TC007_Create_a_new_inspection_and_verify_it_appears_in_the_inspections_list.py](./TC007_Create_a_new_inspection_and_verify_it_appears_in_the_inspections_list.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/522eabc3-c760-4633-9a1d-a8072983a91f/9f0de4a4-886b-496c-bfa2-71ea234bcfe2
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Edit an existing inspection and verify updated details are shown
- **Test Code:** [TC008_Edit_an_existing_inspection_and_verify_updated_details_are_shown.py](./TC008_Edit_an_existing_inspection_and_verify_updated_details_are_shown.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/522eabc3-c760-4633-9a1d-a8072983a91f/d2b29413-7be0-470c-92b4-05de4879fe98
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Mark an inspection as completed and verify status changes to Completed
- **Test Code:** [TC010_Mark_an_inspection_as_completed_and_verify_status_changes_to_Completed.py](./TC010_Mark_an_inspection_as_completed_and_verify_status_changes_to_Completed.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/522eabc3-c760-4633-9a1d-a8072983a91f/56e8d1e4-80db-40f3-80a6-25950644aad7
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Confirm completion and verify Completed status persists on inspection view
- **Test Code:** [TC011_Confirm_completion_and_verify_Completed_status_persists_on_inspection_view.py](./TC011_Confirm_completion_and_verify_Completed_status_persists_on_inspection_view.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/522eabc3-c760-4633-9a1d-a8072983a91f/1c81f9dd-1e90-4333-93ff-a7810052435e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Attempt to delete an inspection without a deletion reason and verify validation error
- **Test Code:** [TC012_Attempt_to_delete_an_inspection_without_a_deletion_reason_and_verify_validation_error.py](./TC012_Attempt_to_delete_an_inspection_without_a_deletion_reason_and_verify_validation_error.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Login page did not render any interactive elements; 0 interactive elements found on /login.
- Email/username input field not found on the /login page, preventing credential entry.
- Password input field not found on the /login page, preventing credential entry.
- Sign in / Submit button not found on the /login page, preventing authentication and subsequent test steps.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/522eabc3-c760-4633-9a1d-a8072983a91f/03982332-7976-4c93-ace8-63d40808fd3b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Submit new inspection with missing mandatory field and verify field-level validation prevents save
- **Test Code:** [TC013_Submit_new_inspection_with_missing_mandatory_field_and_verify_field_level_validation_prevents_save.py](./TC013_Submit_new_inspection_with_missing_mandatory_field_and_verify_field_level_validation_prevents_save.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/522eabc3-c760-4633-9a1d-a8072983a91f/b5b4e201-a7bb-4dc4-951f-9301ce368f17
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Request password reset with a registered email shows confirmation message
- **Test Code:** [TC014_Request_password_reset_with_a_registered_email_shows_confirmation_message.py](./TC014_Request_password_reset_with_a_registered_email_shows_confirmation_message.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/522eabc3-c760-4633-9a1d-a8072983a91f/3fd65326-47ad-4ee7-8c08-6bb010ebe36e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Unknown email request shows generic confirmation (no account enumeration)
- **Test Code:** [TC016_Unknown_email_request_shows_generic_confirmation_no_account_enumeration.py](./TC016_Unknown_email_request_shows_generic_confirmation_no_account_enumeration.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/522eabc3-c760-4633-9a1d-a8072983a91f/537cba73-56b8-41d1-be92-5a2f5f479e25
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018 Reset Password with mismatched confirmation shows error and does not succeed
- **Test Code:** [TC018_Reset_Password_with_mismatched_confirmation_shows_error_and_does_not_succeed.py](./TC018_Reset_Password_with_mismatched_confirmation_shows_error_and_does_not_succeed.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/522eabc3-c760-4633-9a1d-a8072983a91f/fed57f62-a64e-44e6-8406-cb789715da62
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC020 Reset Password with expired/invalid token shows token error and prompts next step
- **Test Code:** [TC020_Reset_Password_with_expiredinvalid_token_shows_token_error_and_prompts_next_step.py](./TC020_Reset_Password_with_expiredinvalid_token_shows_token_error_and_prompts_next_step.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Reset-password page did not render; page contains 0 interactive elements.
- Reset password form fields (New password, Confirm password) not found on the page.
- Error message 'Token invalid or expired' is not visible because the page content did not load.
- No link or button to request a new password link or to navigate elsewhere is available on the page.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/522eabc3-c760-4633-9a1d-a8072983a91f/1af6a054-44ad-44dc-aa89-8e87bd3f7643
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **73.33** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---