from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Float, Numeric, Table, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

# Helper to generate UUIDs
def generate_uuid():
    return str(uuid.uuid4())

class SubmissionType(Base):
    __tablename__ = "research_submission_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    
    deadline_standard = Column(DateTime(timezone=True), nullable=False)
    deadline_extended = Column(DateTime(timezone=True), nullable=True)
    penalty_per_day = Column(Numeric(5, 2), default=0.0)
    
    is_active = Column(Boolean, default=True)
    checklist_config = Column(JSON, nullable=True) # List of strings: ["Formato...", "Anonimato..."]
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship with section configs
    sections = relationship("SubmissionSectionConfig", back_populates="submission_type", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="submission_type")

class SubmissionSectionConfig(Base):
    __tablename__ = "research_section_configs"

    id = Column(Integer, primary_key=True, index=True)
    submission_type_id = Column(Integer, ForeignKey("research_submission_types.id"))
    
    title = Column(String, nullable=False)
    help_text = Column(Text, nullable=True)
    section_order = Column(Integer, nullable=False)
    
    data_type = Column(String, nullable=False) # TEXT, FILE, BOOLEAN
    min_words = Column(Integer, default=0)
    max_words = Column(Integer, nullable=True)
    allowed_file_types = Column(String, nullable=True)
    is_required = Column(Boolean, default=True)

    submission_type = relationship("SubmissionType", back_populates="sections")
    values = relationship("SubmissionValue", back_populates="section_config")

class Submission(Base):
    __tablename__ = "research_submissions"

    id = Column(String, primary_key=True) # Format: TRB-0001
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    type_id = Column(Integer, ForeignKey("research_submission_types.id"))
    
    title = Column(Text, nullable=True) # Extracted from values
    specialty = Column(String, nullable=True) # Global specialty selection
    
    # Status: BORRADOR, ENVIADO, EN_REVISION, OBSERVADO, ACEPTADO, RECHAZADO
    status = Column(String, default='BORRADOR')
    checklist = Column(JSON, nullable=True) # Checklist data for Visto Bueno
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    last_updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    juror_score = Column(Numeric(5, 2), nullable=True)
    penalty_applied = Column(Numeric(5, 2), default=0)
    final_score = Column(Numeric(5, 2), nullable=True)
    
    is_late_submission = Column(Boolean, default=False)

    # Relationships
    user = relationship("User") # Assumes User model is available via foreign key or imported if needed, but string FK works usually if User is in Base. Using string "User" for lazy load.
    submission_type = relationship("SubmissionType", back_populates="submissions")
    values = relationship("SubmissionValue", back_populates="submission", cascade="all, delete-orphan")
    feedback = relationship("SubmissionFeedback", back_populates="submission", cascade="all, delete-orphan")
    feedback = relationship("SubmissionFeedback", back_populates="submission", cascade="all, delete-orphan")
    audit_logs = relationship("ResearchAudit", back_populates="submission", cascade="all, delete-orphan")
    files = relationship("ResearchFile", back_populates="submission", cascade="all, delete-orphan")

class ResearchAudit(Base):
    __tablename__ = "research_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(String, ForeignKey("research_submissions.id"))
    user_id = Column(String, ForeignKey("users.id"))
    
    action = Column(String, nullable=False) # UPDATE_CONTENT, STATUS_CHANGE, FEEDBACK_ADDED
    details = Column(String, nullable=True)
    previous_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    submission = relationship("Submission", back_populates="audit_logs")
    user = relationship("User")

class SubmissionValue(Base):
    __tablename__ = "research_submission_values"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(String, ForeignKey("research_submissions.id"))
    section_config_id = Column(Integer, ForeignKey("research_section_configs.id"))
    
    content_text = Column(Text, nullable=True)
    file_url = Column(String, nullable=True)
    bool_value = Column(Boolean, nullable=True)
    
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    submission = relationship("Submission", back_populates="values")
    section_config = relationship("SubmissionSectionConfig", back_populates="values")

class SubmissionFeedback(Base):
    __tablename__ = "research_feedback"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(String, ForeignKey("research_submissions.id"))
    reviewer_id = Column(String, ForeignKey("users.id"))
    
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    submission = relationship("Submission", back_populates="feedback")
    submission = relationship("Submission", back_populates="feedback")
    reviewer = relationship("User")

class ResearchFile(Base):
    __tablename__ = "research_files"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(String, ForeignKey("research_submissions.id"), nullable=False)
    uploader_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    file_type = Column(String, nullable=False) # 'SLIDES', 'DOCUMENT', 'CONSENT'
    file_path = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    
    version = Column(Integer, default=1)
    status = Column(String, default="PENDING") # PENDING, APPROVED, CORRECTION_REQUESTED
    
    admin_comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    submission = relationship("Submission", back_populates="files")
    uploader = relationship("User")
