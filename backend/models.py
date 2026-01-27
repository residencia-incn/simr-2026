from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, DECIMAL, ForeignKey, JSON, Float, Time, Date, Enum, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, backref
from database import Base
import datetime
import enum
import secrets

# --- ENUMS PARA PLANIFICACIÓN Y PROGRAMA ---
class ActivityStatus(str, enum.Enum):
    DRAFT = "borrador"
    SCHEDULED = "programado"
    PUBLIC = "publicado"
    CANCELLED = "cancelado"
    ARCHIVED = "archivado"

class ActivityType(str, enum.Enum):
    GENERAL = "general"
    SESSION = "ponencia"
    CEREMONY = "ceremonia"

class MeetingStatus(str, enum.Enum):
    PROGRAMADA = "PROGRAMADA"
    EN_CURSO = "EN_CURSO"
    FINALIZADA = "FINALIZADA"   # Se cerró la sesión, inicia conteo de 15 min
    CERRADA = "CERRADA"         # Pasaron los 15 min, nadie más firma

class AttendanceStatus(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    PENDING = "PENDIENTE" # Alias
    PRESENTE = "PRESENTE"
    TARDANZA = "TARDANZA"       # Multa S/ 10.00
    FALTA = "FALTA"             # Multa S/ 20.00
    JUSTIFICADA = "JUSTIFICADA"

class TransactionType(str, enum.Enum):
    INSCRIPCION = "INSCRIPCION"
    TALLER = "TALLER"
    PENALIDAD = "PENALIDAD" # Tardanzas y Faltas
    APORTE_MENSUAL = "APORTE_MENSUAL"

class PaymentStatus(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    PENDING = "PENDIENTE"     # Alias
    APPROVED = "APPROVED"     # Dinero validado
    REJECTED = "REJECTED"     # Voucher rechazado
    ANULADO = "ANULADO"       # Justificado

class ContributionStatus(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    PENDING = "PENDIENTE"      # Alias
    IN_PROCESS = "IN_PROCESS"  # Voucher enviado
    PAID = "PAID"              # Deuda saldada

class IncomeCategory(str, enum.Enum):
    CONTRIBUTION = "APORTE"
    FINE = "MULTA"
    REGISTRATION = "INSCRIPCION"
    WORKSHOP = "TALLER"
    OTHER = "OTRO"

class TaskPriority(str, enum.Enum):
    BAJA = "BAJA"
    MEDIA = "MEDIA"
    ALTA = "ALTA"

class TaskStatus(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    PENDING = "PENDIENTE"
    EN_PROGRESO = "EN_PROGRESO"
    COMPLETADA = "COMPLETADA"

class PollType(str, enum.Enum):
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    BINARY = "BINARY" # Verdadero/Falso, Sí/No

class PollStatus(str, enum.Enum):
    DRAFT = "DRAFT"       # Creada pero no visible
    ACTIVE = "ACTIVE"     # Lanzada, recibiendo votos
    CLOSED = "CLOSED"     # Finalizada, solo resultados

# --- GENERADOR DE IDs ---
def generate_activity_id():
    return "Act_" + secrets.token_urlsafe(6)

# Nota: Usamos 'String' para los IDs porque tu PDF usa formatos como "superadmin-1" o "Cu_17..."

class User(Base):
    __tablename__ = "users"

    # Datos principales (PDF Pág 1)
    id = Column(String, primary_key=True, index=True) # Ej: "superadmin-1"
    email = Column(String, unique=True, index=True)
    password = Column(String)
    name = Column(String)
    firstName = Column(String)
    lastName = Column(String)
    dni = Column(String)
    eventRole = Column(String) # Ej: "organizador"
    birthDate = Column(DateTime)
    organizerFunction = Column(String) # "organizer Function" en PDF
    hasPaid = Column(Boolean, default=False)
    
    # Arrays JSON (PDF Pág 1)
    modules = Column(JSON) # ["mi_perfil", "organizacion"]
    permissions = Column(JSON) # ["admin:all"]
    roles = Column(JSON, default=[]) # ["organizador", "ponente"]

    # Datos adicionales (PDF Pág 2)
    isSuperAdmin = Column(Boolean, default=False)
    specialty = Column(String)
    occupation = Column(String)
    institution = Column(String)
    registrationType = Column(String)
    university = Column(String, nullable=True)
    registrationDate = Column(DateTime)
    status = Column(String, index=True)
    amount = Column(Integer, default=0)
    image = Column(String, nullable=True)
    gender = Column(String)
    purchasedItems = Column(JSON) # Array de items comprados (LEGACY)

    # 🧬 NUEVAS LLAVES DE ACCESO (V2)
    modality_id = Column(Integer, ForeignKey("registration_modalities.id"), nullable=True) # ID de RegistrationModality
    workshops = Column(JSON, default=[]) # Array de IDs de Talleres [1, 2, 5]
    
    # Identificadores Profesionales
    cmp_number = Column(String, nullable=True)
    rne_number = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    residencyYear = Column(String, nullable=True)

    # Relaciones
    financial_records = relationship("FinancialRecord", back_populates="user")
    meeting_attendances = relationship("MeetingAttendance", back_populates="user")
    registration_modality = relationship("RegistrationModality")

class AttendeeLegacy(Base):
    __tablename__ = "attendees_legacy" # "Asistentes (Legacy)" PDF Pág 2

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    role = Column(String)
    specialty = Column(String)
    modality = Column(String)
    date = Column(DateTime)
    status = Column(String)
    amount = Column(Integer)
    institution = Column(String)
    grade = Column(Integer)
    attendancePercentage = Column(Integer)
    certificationApproved = Column(Boolean)
    dni = Column(String)
    cmp = Column(String)
    email = Column(String)

class OrganizerCommittee(Base):
    __tablename__ = "organizer_committee" # PDF Pág 4

    id = Column(String, primary_key=True) # Ej: "com-001"
    role = Column(String) # Ej: "Presidenta"
    title = Column(String)
    members = Column(JSON) # Array de objetos miembros

class ProgramConfig(Base):
    __tablename__ = "program_config" # Configuración del Programa (PDF Pág 4)
    
    # Como es una configuración, usualmente hay una sola fila, o un ID simple
    id = Column(Integer, primary_key=True, index=True)
    days = Column(JSON) # Array de días
    timeSlots = Column(JSON) # Array de franjas horarias

class ScientificProgram(Base):
    __tablename__ = "scientific_program" # PDF Pág 5

    id = Column(Integer, primary_key=True, index=True) # No especifica ID en PDF, asumimos Serial
    type = Column(String) # "full"
    time = Column(String) # "08:00 - 09:00"
    title = Column(String)
    room = Column(String)
    color = Column(String)

class EventRoadmap(Base):
    __tablename__ = "event_roadmap" # PDF Pág 5

    id = Column(String, primary_key=True) # "ev-001"
    title = Column(String)
    date = Column(DateTime)
    description = Column(Text)
    year = Column(String)
    completed = Column(Boolean)
    icon = Column(String)
    
    # New fields
    isActive = Column(Boolean, default=True)
    order = Column(Integer, default=0)
    sort_date = Column(DateTime, nullable=True)
    
    # Display & Interactivity fields
    date_display = Column(String)
    cta_text = Column(String)
    cta_link = Column(String)
    icon_name = Column(String)

class ResearchWork(Base):
    __tablename__ = "research_works" # PDF Pág 6

    id = Column(String, primary_key=True) # "TRB-101"
    title = Column(Text)
    author = Column(String)
    authorId = Column(String) # Referencia al usuario
    type = Column(String)
    specialty = Column(String)
    status = Column(String)
    submittedAt = Column(DateTime, default=datetime.datetime.utcnow)
    abstract = Column(JSON) # Objeto complejo {introduction, objective...}
    scores = Column(JSON) # Array de puntajes

class Juror(Base):
    __tablename__ = "jurors" # PDF Pág 7

    id = Column(String, primary_key=True) # "J-001"
    name = Column(String)
    specialty = Column(String)
    institution = Column(String)
    email = Column(String)
    active = Column(Boolean)

class ScientificPoster(Base):
    __tablename__ = "scientific_posters" # PDF Pág 7

    id = Column(String, primary_key=True) # "P-001"
    title = Column(Text)
    author = Column(String)
    coauthors = Column(Text)
    specialty = Column(String)
    thumb = Column(String) # URL de la imagen
    abstract = Column(Text)
    institution = Column(String)

class AcademicConfig(Base):
    __tablename__ = "academic_config" # PDF Pág 8

    id = Column(Integer, primary_key=True) # ID interno para la config
    titleWordLimit = Column(Integer)
    submissionDeadline = Column(String) # PDF lo define como TEXTO ISO
    extensionDeadline = Column(String)
    latePenalty = Column(Integer)
    sections = Column(JSON) # Array de secciones
    workTypes = Column(JSON) # Array ["Trabajo Original", ...]
    declarations = Column(JSON)
    rubrics = Column(JSON) # Rúbricas de evaluación
    rooms = Column(JSON) # Objetos físicos/virtuales

class FinancialTransaction(Base):
    __tablename__ = "financial_transactions" # PDF Pág 9 (Diferenciado de inscripciones)

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime)
    description = Column(Text)
    category = Column(String)
    amount = Column(Float)
    type = Column(String) # "expense" o "income"
    
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=True)
    voucher_url = Column(String, nullable=True)
    recorded_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    bank_account = relationship("BankAccount")
    recorder = relationship("User")

class Budget(Base):
    __tablename__ = "budgets" # PDF Pág 9

    id = Column(Integer, primary_key=True, index=True) # Agregado ID para clave primaria
    category = Column(String)
    amount = Column(Integer)
    # Alias for router compatibility
    presupuestado = amount 

BudgetPlan = Budget

# --- CONFIGURACIÓN DEL PERIODO FISCAL ---
class AccountingConfig(Base):
    __tablename__ = "accounting_config"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, unique=True, nullable=False)    # Ej: 2026
    monthly_fee = Column(DECIMAL(10, 2), nullable=False)   # Ej: 100.00
    payment_deadline_day = Column(Integer, nullable=False) # Ej: El día 5 de cada mes
    start_month = Column(Date, nullable=False)             # Ej: 2026-01-01
    end_month = Column(Date, nullable=False)               # Ej: 2026-12-01
    is_active = Column(Boolean, default=True)

# --- TRANSACCIONES (EL VOUCHER) ---
class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False) # Quien originó el pago
    amount = Column(DECIMAL(10, 2), nullable=False)
    voucher_url = Column(String, nullable=True)
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    payment_method = Column(String, default="TRANSFERENCIA") 
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=True) 
    
    status = Column(String, default="PENDIENTE")
    
    # Auditoría de Validación
    verified_by = Column(String, ForeignKey("users.id"), nullable=True) # Quién validó (Tesorera)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Relaciones
    user = relationship("User", foreign_keys=[user_id], backref="payments")
    verifier = relationship("User", foreign_keys=[verified_by])
    bank_account = relationship("BankAccount")
    
    # Un solo pago puede cubrir múltiples conceptos
    contributions = relationship("Contribution", back_populates="payment")
    penalties = relationship("Penalty", back_populates="payment")
    # Link al ingreso real en caja (si se aprueba)
    income_entry = relationship("Income", back_populates="origin_payment", uselist=False)

# --- DEUDA MENSUAL (LOS CUADRADITOS DE LA MATRIZ) ---
class Contribution(Base):
    __tablename__ = "contributions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    month_date = Column(Date, nullable=False) # Primer día del mes a cobrar
    amount = Column(DECIMAL(10, 2), nullable=False)
    
    status = Column(Enum(ContributionStatus), default=ContributionStatus.PENDING)
    
    # Si está pagado o en proceso, apunta a una transacción
    payment_id = Column(Integer, ForeignKey("payment_transactions.id"), nullable=True)
    
    user = relationship("User", backref="contributions")
    payment = relationship("PaymentTransaction", back_populates="contributions")

# --- MULTAS Y PENALIDADES ---
class Penalty(Base):
    __tablename__ = "penalties"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    concept = Column(String, nullable=False) # Renamed from reason to match DB
    amount = Column(DECIMAL(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    status = Column(String, default="PENDING")
    
    payment_id = Column(Integer, ForeignKey("payment_transactions.id"), nullable=True)

    user = relationship("User", backref="penalties")
    payment = relationship("PaymentTransaction", back_populates="penalties")

# Legacy Course model removed. Unified version is defined below.

class CourseModule(Base):
    __tablename__ = "modules" # PDF Pág 11

    id = Column(Integer, primary_key=True, index=True)
    courseId = Column(String, ForeignKey("courses.id")) # Relación explícita
    title = Column(String)
    order = Column(Integer)
    status = Column(String)
    items = Column(JSON) # Array de items
    description = Column(Text)

class Lesson(Base):
    __tablename__ = "lessons" # PDF Pág 12

    id = Column(Integer, primary_key=True, index=True)
    moduleId = Column(Integer, ForeignKey("modules.id")) # Relación explícita
    title = Column(String)
    type = Column(String) # "VIDEO", "QUIZ"
    content = Column(String) # ID del video o contenido
    duration = Column(String)
    order = Column(Integer)
    isRequired = Column(Boolean)
    status = Column(String)
    completed = Column(Boolean)
    startDate = Column(DateTime, nullable=True)

class Exam(Base):
    __tablename__ = "exams" # PDF Pág 13

    id = Column(String, primary_key=True) # "EX-2024..."
    title = Column(String)
    courseId = Column(String, ForeignKey("courses.id"))
    courseName = Column(String)
    description = Column(Text)
    status = Column(String)
    timeLimit = Column(Integer) # Minutos
    attempts = Column(Integer)


    passingScore = Column(Integer)
    randomOrder = Column(Boolean)
    showResults = Column(Boolean)
    concentrationMode = Column(Boolean)
    createdAt = Column(DateTime)
    updatedAt = Column(DateTime)
    totalAttempts = Column(Integer)
    questions = Column(JSON) # El array masivo de preguntas

class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    lessonId = Column(Integer, ForeignKey("lessons.id"))
    played_seconds = Column(DECIMAL, default=0)
    total_seconds = Column(DECIMAL, default=0)
    completed = Column(Boolean, default=False)
    is_unlocked = Column(Boolean, default=True)

class SystemConfig(Base):
    """
    Tabla Singleton (siempre ID 1).
    Centraliza la configuración global del sistema y listas maestras.
    """
    __tablename__ = "system_config"

    id = Column(Integer, primary_key=True, index=True)
    
    # --- Parámetros Generales ---
    event_name = Column(String, default="Simposio Internacional de Medicina y Residencia")
    event_year = Column(String, default="2026")
    start_date = Column(String) # Almacenado como ISO string (YYYY-MM-DD)
    end_date = Column(String)
    show_countdown = Column(Boolean, default=True)
    event_duration = Column(Integer, default=3)
    event_schedule = Column(JSON) # [{'day': 1, 'open': '08:00', 'close': '18:00'}, ...]
    public_sections = Column(JSON) # [{'id': 'bases', 'label': 'Bases', 'isVisible': true, ...}, ...]
    
    # --- Roles y Módulos (Listas maestras para Dropdowns) ---
    allowed_roles = Column(JSON, default=[])
    allowed_specialties = Column(JSON, default=[]) # Subespecialidades (Academic)
    allowed_occupations = Column(JSON, default=[])
    residency_years = Column(JSON, default=[])
    participant_specialties = Column(JSON, default=[]) # Especialidades (Participants)
    allowed_institutions = Column(JSON, default=[])
    allowed_universities = Column(JSON, default=[])
    
    # Removed separate lists for standard Workshops/Modalities as they have tables
    # Kept as fallback or for dynamic data if needed

    # --- Configuración Extra ---
    maintenance_mode = Column(Boolean, default=False)

class RegistrationModality(Base):
    """
    Centraliza los tipos de inscripción y sus precios.
    """
    __tablename__ = "registration_modalities"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True) # Ej: t_1767220000001
    title = Column(String) # "Virtual (Sin Certificado)"
    subtitle = Column(String, nullable=True)
    price = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    includes_certificate = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)


class Workshop(Base):
    """
    Talleres disponibles para compra.
    """
    __tablename__ = "workshops"

    id = Column(String, primary_key=True) # "ws_01"
    name = Column(String)
    price = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)


class RoleProfile(Base):
    """
    🧬 GENOTIPO DEL ROL
    Define la plantilla base (permisos y configuración) para nuevos usuarios.
    """
    __tablename__ = "role_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # Ej: "Médico Residente"
    slug = Column(String, unique=True, index=True) # Ej: "residente" (uso interno)
    description = Column(String, nullable=True)

    # --- Permisos (Sistema Nervioso) ---
    # Módulos sugeridos (el usuario puede desactivarlos luego)
    default_modules = Column(JSON, default=[]) 
    # Módulos OBLIGATORIOS (siempre activos para este rol)
    mandatory_modules = Column(JSON, default=[]) 

    # --- Configuración (Metabolismo) ---
    # La prioridad define quién gana en caso de conflicto.
    # 1 = Máxima prioridad (Ej: Organizador), 99 = Mínima (Ej: Asistente)
    priority = Column(Integer, default=99, nullable=False)
    
    # Modalidad de pago por defecto (Guarda el ID/Código del JSON de configuración, ej: "t_176...")
    default_modality_id = Column(String, nullable=True)
    # Talleres pre-seleccionados (Lista de IDs)
    default_workshops = Column(JSON, default=[]) 

    is_active = Column(Boolean, default=True)

class Course(Base):
    """
    🏫 Cursos y Talleres (Aulas del Hospital)
    Define el contenido educativo y las "llaves" necesarias para entrar.
    """
    __tablename__ = "courses"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True) # "Cu_17..."
    title = Column(String)
    slug = Column(String)
    description = Column(Text)
    longDescription = Column(Text)
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    status = Column(String)
    specialty = Column(String)
    category = Column(String)
    difficulty = Column(String)
    coverImage = Column(String)
    coverGradient = Column(String)
    enrolledStudents = Column(Integer, default=0)
    rating = Column(DECIMAL, default=0)
    totalRatings = Column(Integer, default=0)
    duration = Column(String)
    totalModules = Column(Integer, default=0)
    totalLessons = Column(Integer, default=0)
    certificateEnabled = Column(Boolean, default=True)
    instructorId = Column(String)
    price = Column(Integer, default=0)
    
    # --- Control de Acceso (Las Llaves) ---
    is_main_event = Column(Boolean, default=False)
    allowed_modality_ids = Column(JSON, default=[]) 
    linked_workshop_id = Column(Integer, nullable=True)

    # --- Contenido ---
    content_data = Column(JSON, default={}) 
    is_published = Column(Boolean, default=False)

class Transaction(Base):
    """
    🧾 HISTORIAL DE TRANSACCIONES
    Guarda el intento de inscripción y el 'Snapshot' de lo que se compró.
    """
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True) # Indexado para búsquedas rápidas
    
    # Estado del trámite
    status = Column(String, default="pending", index=True) # Indexado
    
    # Evidencia Financiera
    total_amount = Column(Float, default=0.0)
    voucher_url = Column(String, nullable=True) # URL de la imagen en Cloudinary/S3/Local
    coupon_code_used = Column(String, nullable=True)
    
    # 🧬 SNAPSHOT: Qué compró exactamente.
    # Formato esperado: {"modality_id": 2, "workshop_ids": [1, 5]}
    items_snapshot = Column(JSON, nullable=False) 

    # Auditoría
    approved_by_id = Column(String, ForeignKey("users.id"), nullable=True) # Corregido a String
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True) # Indexado
    
    # Relaciones
    user = relationship("User", foreign_keys=[user_id], backref="transactions")
    approver = relationship("User", foreign_keys=[approved_by_id])

class Coupon(Base):
    """
    🎫 SISTEMA DE CUPONES Y BECAS
    Permite descuentos granulares por modalidad o talleres específicos.
    """
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    expiry = Column(String, nullable=False) # Guardamos como string ISO para simplificar con el frontend
    max_uses = Column(Integer, default=0) # 0 = ilimitado
    used_count = Column(Integer, default=0)
    
    # Descuentos específicos (Legacy - Deprecated but kept for safety)
    applicable_modality = Column(String, nullable=True) 
    modality_discount = Column(Float, default=0.0) 
    workshop_discounts = Column(JSON, default={})
    
    # Nuevo Sistema Granular (Micro-Cirugía)
    discount_type = Column(String, default="PERCENTAGE") # 'PERCENTAGE' o 'FIXED'
    discount_value = Column(Integer, default=100) # 100 = Gratis, 50 = Mitad
    target_modules = Column(JSON, default=[]) # Lista de IDs: ["t_residente", "ws_01"]
    
    active = Column(Boolean, default=True)
    group_tag = Column(String, index=True, nullable=True) # Ej: "RESIDENTES-2026"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)

    # Relación para historial detallado
    usages = relationship("CouponUsage", back_populates="coupon")

class CouponUsage(Base):
    """
    Log inmutable de auditoría: Quién usó qué y cuándo
    """
    __tablename__ = "coupon_usages"
    
    id = Column(Integer, primary_key=True, index=True)
    coupon_id = Column(Integer, ForeignKey("coupons.id"))
    user_id = Column(String, ForeignKey("users.id"))
    used_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    coupon = relationship("Coupon", back_populates="usages")
    user = relationship("User")

class RegistrationRequest(Base):
    """
    ⏳ SALA DE ESPERA (Tabla Temporal)
    Aquí llegan los datos del formulario web. No es un usuario todavía.
    """
    __tablename__ = "registration_requests"

    id = Column(Integer, primary_key=True, index=True)
    
    # Datos Personales
    dni = Column(String, index=True)
    email = Column(String)
    firstname = Column(String)
    lastname = Column(String)
    phone = Column(String, nullable=True)
    occupation = Column(String, nullable=True)
    cmp_number = Column(String, nullable=True)
    rne_number = Column(String, nullable=True)
    university = Column(String, nullable=True)
    residency_year = Column(String, nullable=True)
    
    # La Evidencia del Pago
    total_amount = Column(Float)
    payment_account = Column(String, nullable=True) # BCP, Yape...
    voucher_url = Column(String, nullable=True)
    coupon_code_used = Column(String, nullable=True)

    # 🧬 EL ADN DE LA COMPRA (Snapshot JSON)
    # Aquí guardamos: { "modality": {...}, "workshops": [...] }
    items_detail = Column(JSON, nullable=False)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)



# --- MODELOS DE COMITÉ (RESTAURADOS) ---
class Committee(Base):
    __tablename__ = "committees"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    order = Column(Integer, default=0)
    members = relationship("CommitteeMember", back_populates="committee", cascade="all, delete-orphan")

class CommitteeMember(Base):
    __tablename__ = "committee_members"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    position = Column(String, nullable=False)
    committee_id = Column(Integer, ForeignKey("committees.id"), nullable=False)
    priority = Column(Integer, default=10)
    isActive = Column(Boolean, default=True)
    color = Column(String, nullable=True)
    committee = relationship("Committee", back_populates="members")
    user = relationship("User", backref="committee_role")

# --- MODELOS DE PROGRAMA (RESTAURADOS) ---
class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, default="fisica")
    capacity = Column(Integer, nullable=True)
    urlLink = Column(String, nullable=True)
    color = Column(String, default="#3b82f6")
    isActive = Column(Boolean, default=True)

class ScheduleBlock(Base):
    __tablename__ = "schedule_blocks"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    startTime = Column(Time, nullable=False)
    endTime = Column(Time, nullable=False)
    is_break = Column(Boolean, default=False)
    activities = relationship("ProgramActivity", back_populates="block", cascade="all, delete-orphan")

class ProgramActivity(Base):
    __tablename__ = "program_activities"
    id = Column(String, primary_key=True, default=generate_activity_id)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    type = Column(Enum(ActivityType), default=ActivityType.SESSION)
    status = Column(Enum(ActivityStatus), default=ActivityStatus.DRAFT)
    startTime = Column(DateTime, nullable=False)
    endTime = Column(DateTime, nullable=False)
    block_id = Column(Integer, ForeignKey("schedule_blocks.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    speaker_id = Column(String, ForeignKey("users.id"), nullable=True)
    external_paper_id = Column(String, ForeignKey("research_submissions.id"), nullable=True)
    exam_id = Column(String, ForeignKey("exams.id"), nullable=True)
    classification_label = Column(String, nullable=True)
    
    block = relationship("ScheduleBlock", back_populates="activities")
    location = relationship("Location")
    speaker = relationship("User")
    paper = relationship("Submission", foreign_keys=[external_paper_id])
    exam = relationship("Exam", foreign_keys="[ProgramActivity.exam_id]")

# Import new academic models to ensure they are registered with Base.metadata
import models_academic
import models_research

# --- MODELOS DE PLANIFICACIÓN Y SECRETARÍA (AUDITORÍA) ---
class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    scheduled_start = Column(DateTime, nullable=False) # Fecha programada
    
    # Datos reales de ejecución (Auditoría)
    real_start_time = Column(DateTime, nullable=True) # Cuando la secretaria dio "Iniciar"
    real_end_time = Column(DateTime, nullable=True)   # Cuando la secretaria dio "Terminar"
    
    status = Column(Enum(MeetingStatus), default=MeetingStatus.PROGRAMADA)
    created_by = Column(String, ForeignKey("users.id"))
    next_meeting_agenda = Column(JSON, nullable=True) # Hierarchical agenda for following meeting
    is_preview_active = Column(Boolean, default=False)
    
    # Enlace a la siguiente reunión programada desde esta
    next_meeting_id = Column(Integer, nullable=True)

    # Relaciones
    agreements = relationship("MeetingAgreement", back_populates="meeting", cascade="all, delete-orphan")
    attendances = relationship("MeetingAttendance", back_populates="meeting", cascade="all, delete-orphan")

class MeetingAgreement(Base):
    """Soporta acuerdos anidados y asignación de tareas"""
    __tablename__ = "meeting_agreements"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("meeting_agreements.id", ondelete="CASCADE"), nullable=True)
    
    content = Column(Text, nullable=False)
    level = Column(Integer, default=0) # 0: Tema Principal, 1: Acuerdo, 2: Sub-acuerdo
    
    # Gestión de Tareas (Assignment)
    assigned_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    deadline = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False)

    # Relaciones
    meeting = relationship("Meeting", back_populates="agreements")
    sub_agreements = relationship(
        "MeetingAgreement", 
        backref=backref("parent", remote_side=[id]),
        cascade="all, delete-orphan"
    )
    assignee = relationship("User", foreign_keys=[assigned_user_id])
    
    @property
    def children(self):
        return self.sub_agreements

class MeetingAttendance(Base):
    __tablename__ = "meeting_attendance"
    meeting_id = Column(Integer, ForeignKey("meetings.id"), primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    
    check_in_time = Column(DateTime, nullable=True)
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.PENDIENTE)
    is_justified = Column(Boolean, default=False)
    justification_reason = Column(String(500), nullable=True)
    
    signed_at = Column(DateTime, nullable=True)
    signature_hash = Column(String(512), nullable=True) # Hash SHA-256
    notes = Column(Text, nullable=True)

    meeting = relationship("Meeting", back_populates="attendances")
    user = relationship("User", back_populates="meeting_attendances")

    @property
    def user_name(self):
        if self.user:
            fn = self.user.firstName or ""
            ln = self.user.lastName or ""
            full_name = f"{fn} {ln}".strip()
            return full_name or self.user.name or "Participante"
        return "Participante"

class FinancialRecord(Base):
    """Registro unificado de ingresos, aportes y penalidades"""
    __tablename__ = "financial_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    amount = Column(Float, nullable=False)
    concept = Column(String(255), nullable=False)
    
    type = Column(Enum(TransactionType), nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDIENTE)
    
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.datetime.now)

    # Auditoría de origen (Trazabilidad)
    origin_source = Column(String(50)) # Ej: "MEETING"
    origin_id = Column(Integer, nullable=True) # ID de la reunión

    user = relationship("User", back_populates="financial_records")

class MeetingTask(Base):
    """Modelo de tareas ligado a reuniones con seguimiento de progreso"""
    __tablename__ = "meeting_tasks"
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assigned_to = Column(String, ForeignKey("users.id"), nullable=False)
    assigned_by = Column(String, ForeignKey("users.id"), nullable=True)
    
    deadline = Column(DateTime, nullable=True)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIA)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDIENTE)
    progress = Column(Integer, default=0) # 0 a 100
    
    comments = Column(JSON, default=[]) # Historial de actualizaciones

    meeting = relationship("Meeting", backref=backref("tasks", cascade="all, delete-orphan"))
    assignee = relationship("User", foreign_keys=[assigned_to], backref="assigned_tasks")
    assigner = relationship("User", foreign_keys=[assigned_by])

class Poll(Base):
    __tablename__ = "polls"
    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    title = Column(String(255), nullable=False)
    poll_type = Column(Enum(PollType), default=PollType.MULTIPLE_CHOICE)
    status = Column(Enum(PollStatus), default=PollStatus.DRAFT)
    
    # Configuración de visibilidad (Tiempo eliminado por petición)
    # time_limit = Column(Integer, default=60) 
    created_at = Column(DateTime, default=func.now())
    launched_at = Column(DateTime, nullable=True)
    
    # Relaciones
    meeting = relationship("Meeting", backref=backref("polls", cascade="all, delete-orphan"))
    options = relationship("PollOption", back_populates="poll", cascade="all, delete-orphan")
    votes = relationship("PollVote", back_populates="poll")

class PollOption(Base):
    __tablename__ = "poll_options"
    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False)
    text = Column(String(255), nullable=False)
    color = Column(String(20), default="blue") # Para la UI gráfica: blue, emerald, amber, rose, indigo
    
    poll = relationship("Poll", back_populates="options")
    votes = relationship("PollVote", back_populates="option")

class PollVote(Base):
    __tablename__ = "poll_votes"
    id = Column(Integer, primary_key=True)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False)
    option_id = Column(Integer, ForeignKey("poll_options.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())

    poll = relationship("Poll", back_populates="votes")
    option = relationship("PollOption", back_populates="votes")
    user = relationship("User")

    # Constraint vital: Un usuario solo un voto por encuesta
    __table_args__ = (
        UniqueConstraint('poll_id', 'user_id', name='_user_poll_vote_uc'),
    )


# --- INGRESOS (CAJA REAL) ---
class Income(Base):
    __tablename__ = "incomes"
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(DECIMAL(10, 2), nullable=False)
    category = Column(String, nullable=False) # "APORTE", "MULTA", etc.
    concept = Column(String, nullable=True) # Detalle legible
    
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    origin_payment_id = Column(Integer, ForeignKey("payment_transactions.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    bank_account = relationship("BankAccount")
    origin_payment = relationship("PaymentTransaction", back_populates="income_entry")
    
    __table_args__ = {'extend_existing': True}

# --- MODELOS DE TESORERÍA (RESTAURADOS) ---
class SystemSetting(Base):
    __tablename__ = "system_settings"
    key = Column(String, primary_key=True, index=True)
    value = Column(String)

class FinancialInstitution(Base):
    __tablename__ = "financial_institutions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    short_name = Column(String, nullable=True)
    type = Column(String, default="bank") # bank, wallet
    logo_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class BankAccount(Base):
    __tablename__ = "bank_accounts"
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("financial_institutions.id"), nullable=False)
    alias = Column(String, nullable=False) # "BCP Soles", "Yape Titular"
    holder_name = Column(String, nullable=True) # Added for Pydantic validation
    account_number = Column(String, nullable=False)
    cci = Column(String, nullable=True)
    currency = Column(String, default="PEN")
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    institution = relationship("FinancialInstitution")

class FundDestination(Base):
    __tablename__ = "fund_destinations"
    income_type = Column(String, primary_key=True) # "Inscripciones", "Talleres"
    target_account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=True)
    
    account = relationship("BankAccount")


class TransactionCategory(Base):
    __tablename__ = "transaction_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False) # "Logística", "Honorarios"
    type = Column(String, default="expense") # income, expense
    is_system = Column(Boolean, default=False) # Si es True, no se puede borrar
    is_active = Column(Boolean, default=True)

class AuditLog(Base):
    """
    📜 BITÁCORA DE AUDITORÍA
    Registra movimientos críticos realizados por administradores sobre otros usuarios.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now())
    action = Column(String, nullable=False) # Ej: "CAMBIO_PERMISOS", "RESET_PASSWORD"
    
    # Usuarios involucrados
    target_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    admin_user_id = Column(String, ForeignKey("users.id"), nullable=True) # None si es el Sistema
    
    details = Column(JSON, default={}) # Metadata del cambio

    # Relaciones
    target_user = relationship("User", foreign_keys=[target_user_id], backref="logs_as_target")
    admin_user = relationship("User", foreign_keys=[admin_user_id], backref="logs_as_admin")
