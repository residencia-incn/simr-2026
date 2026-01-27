from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, Text, JSON, DateTime
from sqlalchemy.dialects.postgresql import JSONB

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Rubric(Base):
    __tablename__ = "rubrics"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    # Relacionado con el tipo de trabajo (ej: Caso Clínico, Trabajo de Investigación)
    # Permite múltiples tipos
    work_types = Column(JSONB, nullable=False) 
    max_score = Column(Float, default=20.0)
    is_active = Column(Boolean, default=True)

    # Relaciones
    evaluations = relationship("Evaluation", back_populates="rubric")

class JuryAssignment(Base):
    __tablename__ = "jury_assignments"

    id = Column(Integer, primary_key=True, index=True)
    work_id = Column(String, ForeignKey("research_submissions.id"), nullable=False) # Linked to Research Submissions (V2)
    jury_user_id = Column(String, ForeignKey("users.id"), nullable=False) # ID del usuario con rol Jurado
    status = Column(String(20), default="PENDIENTE") # PENDIENTE, CALIFICADO
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    submission = relationship("Submission", backref="jury_assignments") # Points to Submission in models_research
    jury = relationship("User", backref="jury_assignments") # Assumes User in models.py
    evaluations = relationship("Evaluation", back_populates="assignment")
    signature = Column(String(64), nullable=True) # HMAC-SHA256 signature for integrity

class EvaluationBackup(Base):
    __tablename__ = "evaluation_backups"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, nullable=False)
    backup_data = Column(JSON, nullable=False) # Full snapshot of the payload
    signature = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("jury_assignments.id"), nullable=False)
    rubric_id = Column(Integer, ForeignKey("rubrics.id"), nullable=False)
    score = Column(Float, nullable=False)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    assignment = relationship("JuryAssignment", back_populates="evaluations")
    rubric = relationship("Rubric", back_populates="evaluations")

class AcademicSetting(Base):
    __tablename__ = "academic_settings"
    
    key = Column(String(50), primary_key=True) # Ej: "jurados_por_trabajo"
    value = Column(String(255), nullable=False) # Ej: "3"

class SpeakerLecture(Base):
    __tablename__ = "speaker_lectures"

    id = Column(Integer, primary_key=True, index=True)
    speaker_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    specialty = Column(String, nullable=True) # Subespecialidad
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    speaker = relationship("User", backref="lectures")
