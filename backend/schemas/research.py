from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime
from decimal import Decimal

# --- SECTIONS ---

class SectionConfigBase(BaseModel):
    title: str
    help_text: Optional[str] = None
    section_order: int
    data_type: str # TEXT, FILE, BOOLEAN
    min_words: Optional[int] = 0
    max_words: Optional[int] = None
    allowed_file_types: Optional[str] = None
    is_required: bool = True

class SectionConfigCreate(SectionConfigBase):
    pass

class SectionConfigResponse(SectionConfigBase):
    id: int
    submission_type_id: int # Changed from type_id slightly to match DB column but usually schema matches model attr
    
    class Config:
        from_attributes = True

# --- SUBMISSION TYPES ---

class SubmissionTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    deadline_standard: datetime
    deadline_extended: Optional[datetime] = None
    penalty_per_day: float = 0.0
    is_active: bool = True
    checklist_config: Optional[List[str]] = None # ["Correct format", "Word limit"]

class SubmissionTypeCreate(SubmissionTypeBase):
    sections: List[SectionConfigCreate] = []

class SubmissionTypeUpdate(SubmissionTypeCreate):
    pass

class SubmissionTypeResponse(SubmissionTypeBase):
    id: int
    created_at: datetime
    sections: List[SectionConfigResponse] = []
    checklist_config: Optional[List[str]] = None

    class Config:
        from_attributes = True

# --- SUBMISSIONS (Values) ---

class SubmissionValueSchema(BaseModel):
    section_config_id: int
    content_text: Optional[str] = None
    bool_value: Optional[bool] = None
    file_url: Optional[str] = None

class SubmissionCreateSchema(BaseModel):
    type_id: int
    title: Optional[str] = None # Can be sent from FE or extracted from values
    specialty: str
    values: List[SubmissionValueSchema]

class SubmissionValueResponse(BaseModel):
    id: int
    submission_id: str
    section_config_id: int
    section_title: Optional[str] = None
    content_text: Optional[str] = None
    file_url: Optional[str] = None
    bool_value: Optional[bool] = None

    class Config:
        from_attributes = True

class SubmissionStatusUpdate(BaseModel):
    status: str
    feedback: Optional[str] = None
    specific_feedback: Optional[List[Dict[str, str]]] = None # [{section: "Intro", comment: "Fix this"}]
    checklist: Optional[Dict[str, bool]] = None

class SubmissionFeedbackResponse(BaseModel):
    id: int
    reviewer_id: str
    comment: str
    created_at: datetime

    class Config:
        from_attributes = True

class ResearchAuditResponse(BaseModel):
    id: int
    action: str
    details: Optional[str] = None
    timestamp: datetime
    user_id: str
    previous_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class SubmissionResponse(BaseModel):
    id: str # Now TRB-XXXX
    user_id: str
    author_name: Optional[str] = None
    type_id: int
    type_name: Optional[str] = None
    title: Optional[str] = None
    specialty: Optional[str] = None
    status: str
    checklist: Optional[Dict[str, bool]] = None
    checklist_config: Optional[List[str]] = None
    submitted_at: Optional[datetime] = None
    is_late_submission: bool
    juror_score: Optional[Decimal] = None
    penalty_applied: Decimal = Decimal('0.00')
    final_score: Optional[Decimal] = None
    values: List[SubmissionValueResponse] = []
    feedback: List[SubmissionFeedbackResponse] = []
    audit_logs: List[ResearchAuditResponse] = []
    schedule_info: Optional[Dict[str, Any]] = None
    latest_slide: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True
