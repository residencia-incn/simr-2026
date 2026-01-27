from schemas.research import SubmissionResponse
from typing import Any

def verify_serialization():
    # Mock data structure matching what enrich_submission provides
    class MockSubmission:
        id = "TRB-0001"
        user_id = "user123"
        type_id = 1
        status = "ACCEPTED"
        is_late_submission = False
        penalty_applied = 0
        schedule_info = {
            "start_time": "2026-06-22 10:00",
            "end_time": "2026-06-22 11:00",
            "location": "Auditorium"
        }
        # Add minimal required fields to pass validation
        feedback = []
        audit_logs = []
        values = []

    mock_obj = MockSubmission()
    
    try:
        # Pydantic validation
        serialized = SubmissionResponse.model_validate(mock_obj)
        print("✅ Serialization Successful")
        
        if serialized.schedule_info and serialized.schedule_info['location'] == "Auditorium":
            print("✅ schedule_info preserved in Pydantic output")
            print(serialized.schedule_info)
        else:
            print("❌ schedule_info MISSING in output")
            
    except Exception as e:
        print(f"❌ Serialization Failed: {e}")

if __name__ == "__main__":
    verify_serialization()
