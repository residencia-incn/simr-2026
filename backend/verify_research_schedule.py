from database import SessionLocal
from routers.research import enrich_submission
from models_research import Submission
from models import ProgramActivity

def verify():
    db = SessionLocal()
    try:
        # Find an activity that has a paper
        activity = db.query(ProgramActivity).filter(ProgramActivity.external_paper_id != None).first()
        
        if not activity:
            print("No scheduled papers found to test.")
            return

        print(f"Testing with Activity: {activity.title} (Paper ID: {activity.external_paper_id})")
        
        # Get the submission
        submission = db.query(Submission).filter(Submission.id == activity.external_paper_id).first()
        
        if not submission:
            print("Submission not found for activity.")
            return

        # Enrich
        enriched = enrich_submission(submission, db)
        
        if hasattr(enriched, 'schedule_info') and enriched.schedule_info:
            print("✅ SUCCESS: Schedule info found!")
            print(enriched.schedule_info)
        else:
            print("❌ FAILURE: Schedule info Missing!")

    finally:
        db.close()

if __name__ == "__main__":
    verify()
