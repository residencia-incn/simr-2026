from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime

from .treasury import *
from .accounting_v2 import *

# --- ESQUEMAS DE USUARIO (User) ---

class UserIdentityCheck(BaseModel):
    email: str
    dni: str
    cmp_number: Optional[str] = None
    rne_number: Optional[str] = None

# --- ROLE PROFILES ---
class RoleProfileBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    default_modules: List[str] = []
    mandatory_modules: List[str] = []
    default_modality_id: Optional[str] = None
    default_workshops: List[str] = [] # Asumimos IDs o CÃ³digos de talleres
    is_active: bool = True

class RoleProfileCreate(RoleProfileBase):
    pass

class RoleProfileUpdate(RoleProfileBase):
    pass

class RoleProfileOut(RoleProfileBase):
    id: int
    class Config:
        from_attributes = True

# --- Cursos ---
class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    image: Optional[str] = None
    is_main_event: bool = False
    allowed_modality_ids: List[str] = []
    linked_workshop_id: Optional[int] = None
    content_data: Dict = {}
    is_published: bool = False

class CourseCreate(CourseBase):
    pass

class CourseUpdate(CourseBase):
    pass

class CourseOut(CourseBase):
    id: int
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# 1. Base: Lo comÃºn que siempre viaja
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    dni: Optional[str] = None
    specialty: Optional[str] = None
    phone: Optional[str] = None
    occupation: Optional[str] = None
    cmp_number: Optional[str] = None
    rne_number: Optional[str] = None
    institution: Optional[str] = None
    university: Optional[str] = None
    residencyYear: Optional[str] = None
    eventRole: Optional[str] = None  # "organizador", "asistente", etc.
    roles: Optional[List[str]] = []         # ["organizador", "ponente"]
    
    
    # Estos son vitales para tu sistema de permisos
    modules: Optional[List[str]] = []         # Ej: ["mi_perfil", "organizacion"]
    permissions: Optional[List[str]] = []     # Ej: ["admin:all"]
    
    # ðŸ§¬ NUEVAS LLAVES DE ACCESO (V2)
    modality_id: Optional[int] = None
    workshops: Optional[List[str]] = [] 
    
    gender: Optional[str] = None
    image: Optional[str] = None

# 2. Create: Lo que necesitamos para registrar un usuario nuevo
class UserCreate(UserBase):
    password: str
    # id: opcional, usualmente se genera solo, pero tu PDF usa strings como "superadmin-1"
    id: Optional[str] = None 

# 3. Login: Lo que manda el frontend para entrar
class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False

# 4. Response: Lo que devolvemos al Frontend (Â¡Sin password!)
class User(UserBase):
    id: str
    isSuperAdmin: bool = False
    status: Optional[str] = None
    hasPaid: bool = False
    purchasedItems: Optional[List[Any]] = []
    
    class Config:
        from_attributes = True # Antes se llamaba orm_mode

# --- ESQUEMAS DE RESPUESTA DE TOKEN (Para el Login) ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User # Devolvemos tambiÃ©n los datos del usuario al hacer login

class TokenData(BaseModel):
    email: Optional[str] = None

# --- ESQUEMAS ACADÃ‰MICOS (Cursos, MÃ³dulos, Lecciones, ExÃ¡menes) ---

# 1. Lecciones (Lessons)
class LessonBase(BaseModel):
    title: str
    type: str
    content: Optional[str] = None
    duration: Optional[str] = None
    order: int
    isRequired: bool = True
    status: str = "published"

class LessonCreate(LessonBase):
    moduleId: int

class Lesson(LessonBase):
    id: int
    moduleId: int
    completed: bool = False
    
    class Config:
        from_attributes = True

# 2. MÃ³dulos (Modules)
class ModuleBase(BaseModel):
    title: str
    order: int
    status: str = "published"
    description: Optional[str] = None
    items: Optional[List[Any]] = []

class ModuleCreate(ModuleBase):
    courseId: str

class Module(ModuleBase):
    id: int
    courseId: str
    
    class Config:
        from_attributes = True

# 3. Cursos (Courses)
class CourseBase(BaseModel):
    id: str
    title: str
    slug: str
    description: Optional[str] = None
    longDescription: Optional[str] = None
    status: str = "published"
    specialty: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[str] = None
    coverImage: Optional[str] = None
    coverGradient: Optional[str] = None
    price: int = 0
    duration: Optional[str] = None
    certificateEnabled: bool = True

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    enrolledStudents: int = 0
    rating: float = 0.0
    totalRatings: int = 0
    totalModules: int = 0
    totalLessons: int = 0
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True

# 4. Progreso (Progress)
class ProgressUpdate(BaseModel):
    played_seconds: float
    total_seconds: float
    completed: bool
    is_unlocked: bool

# 5. ExÃ¡menes (Exams)
class ExamBase(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    courseId: str
    courseName: Optional[str] = None
    status: str = "published"
    timeLimit: int = 60
    attempts: int = 1
    passingScore: int = 70
    randomOrder: bool = False
    showResults: bool = True
    concentrationMode: bool = False

class ExamCreate(ExamBase):
    questions: Optional[List[Any]] = []

class Exam(ExamBase):
    createdAt: datetime
    updatedAt: datetime
    totalAttempts: int = 0
    questions: List[Any] = []

    class Config:
        from_attributes = True

# --- ESQUEMAS PARA MODALIDADES (Modalities) ---
class ModalityBase(BaseModel):
    title: str
    subtitle: Optional[str] = None
    price: int
    description: Optional[str] = None
    includes_certificate: bool = False
    is_active: bool = True

class ModalityCreate(ModalityBase):
    code: str

class ModalityOut(ModalityBase):
    id: int
    code: str
    class Config:
        from_attributes = True

# --- ESQUEMAS PARA CONFIGURACIÃ“N GLOBAL (SystemConfig) ---
class SystemConfigBase(BaseModel):
    event_name: str
    event_year: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    show_countdown: bool
    event_duration: int
    event_schedule: Optional[List[dict]] = None
    public_sections: Optional[List[dict]] = None
    
    # Listas para los Dropdowns
    allowed_roles: List[str]
    allowed_specialties: List[str]
    allowed_occupations: List[Any]
    residency_years: List[str]
    participant_specialties: List[str]
    allowed_institutions: List[str]
    allowed_universities: List[str]
    registration_modalities: Optional[List[dict]] = []
    workshops: Optional[List[dict]] = []

class SystemConfigUpdate(BaseModel):
    event_name: Optional[str] = None
    event_year: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    show_countdown: Optional[bool] = None
    event_duration: Optional[int] = None
    event_schedule: Optional[List[dict]] = None
    public_sections: Optional[List[dict]] = None
    allowed_roles: Optional[List[str]] = None
    allowed_specialties: Optional[List[str]] = None
    allowed_occupations: Optional[List[Any]] = None
    residency_years: Optional[List[str]] = None
    participant_specialties: Optional[List[str]] = None
    allowed_institutions: Optional[List[str]] = None
    allowed_universities: Optional[List[str]] = None
    registration_modalities: Optional[List[dict]] = None
    workshops: Optional[List[dict]] = None
    maintenance_mode: Optional[bool] = None

class SystemConfigOut(SystemConfigBase):
    id: int
    maintenance_mode: bool
    class Config:
        from_attributes = True

# --- ðŸ§¾ ESQUEMAS DE TRANSACCIONES ---

class TransactionBase(BaseModel):
    total_amount: float
    voucher_url: Optional[str] = None
    coupon_code_used: Optional[str] = None
    # El Frontend debe enviar esto explÃ­citamente
    items_snapshot: Dict[str, Any] # Ej: {"modality_id": 1, "workshop_ids": []}

class TransactionCreate(TransactionBase):
    user_id: str # Match User.id type (String)

class TransactionOut(TransactionBase):
    id: int
    user_id: str
    status: str
    created_at: datetime
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    
    # Para mostrar nombres en la tabla del admin
    user_email: Optional[str] = None 
    user_fullname: Optional[str] = None

    class Config:
        from_attributes = True
# ---  CUPONES ---

class CouponBase(BaseModel):
    code: str
    description: Optional[str] = None
    expiry: str
    maxUses: int = Field(alias='max_uses', default=0)
    usedCount: int = Field(alias='used_count', default=0)
    applicableModality: Optional[str] = Field(alias='applicable_modality', default=None)
    modalityDiscount: float = Field(alias='modality_discount', default=0.0)
    workshopDiscounts: Dict[str, float] = Field(alias='workshop_discounts', default={})
    
    # New Micro-Surgery Fields
    discountType: str = Field(alias='discount_type', default='PERCENTAGE')
    discountValue: int = Field(alias='discount_value', default=100)
    targetModules: List[str] = Field(alias='target_modules', default=[])
    
    active: bool = True

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

class CouponCreate(CouponBase):
    pass

class CouponOut(CouponBase):
    id: int

class CouponRedeem(BaseModel):
    code: str

class CouponUsageOut(BaseModel):
    id: int
    user_id: str
    used_at: datetime
    user_name: Optional[str] = None
    coupon_code: Optional[str] = None

    class Config:
        from_attributes = True

class CouponUsageDetail(BaseModel):
    used_at: datetime
    user_full_name: str
    user_email: str
    user_dni: str

    class Config:
        from_attributes = True

class CouponCreateExtended(CouponCreate):
    is_batch: bool = False
    batch_prefix: Optional[str] = None
    quantity: int = 1
    group_tag: Optional[str] = None


# ==========================================
# ⚙️ CONFIGURACIÓN DE TESORERÍA
# ==========================================

# --- Schemas para Configuración Global ---
class SettingsUpdate(BaseModel):
    # Recibimos un diccionario de clave: valor para actualizar varias a la vez
    settings: Dict[str, Any]

# --- Schemas para Instituciones ---
class FinancialInstitutionBase(BaseModel):
    name: str # Full Name
    short_name: Optional[str] = None
    code: Optional[str] = None
    type: str # 'bank' | 'wallet'
    logo_url: Optional[str] = None
    is_active: bool = True

class FinancialInstitutionCreate(FinancialInstitutionBase):
    pass

class FinancialInstitutionUpdate(FinancialInstitutionBase):
    pass

class FinancialInstitutionOut(FinancialInstitutionBase):
    id: int
    class Config:
        from_attributes = True

# --- Schemas para Cuentas Bancarias (El Modal) ---
class BankAccountBase(BaseModel):
    institution_id: int
    alias: str
    holder_name: str
    account_number: str
    cci: Optional[str] = None
    currency: str = "PEN"
    description: Optional[str] = None
    is_active: bool = True

class BankAccountCreate(BankAccountBase):
    pass

class BankAccountUpdate(BankAccountBase):
    pass

class BankAccountOut(BankAccountBase):
    id: int
    balance: float = 0.0 # Nuevo: Saldo calculado en tiempo real
    institution: FinancialInstitutionOut # Incluimos datos del banco
    class Config:
        from_attributes = True

# --- Schemas para Destino de Fondos ---
class DestinationUpdateItem(BaseModel):
    income_type: str
    target_account_id: Optional[int]

class DestinationUpdateBatch(BaseModel):
    destinations: List[DestinationUpdateItem]

# --- Schemas para Categorías de Transacción ---
class CategoryBase(BaseModel):
    name: str
    type: str # 'income' o 'expense'

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int
    is_system: bool
    is_active: bool
    class Config:
        from_attributes = True

# --- SCHEMAS DE COMITÉ ORGANIZADOR (Relacional) ---

class CommitteeBase(BaseModel):
    name: str # e.g. "Junta Directiva"
    description: Optional[str] = None
    order: int = 0

class CommitteeCreate(CommitteeBase):
    pass

class CommitteeUpdate(CommitteeBase):
    pass

class CommitteeOut(CommitteeBase):
    id: int
    class Config:
        from_attributes = True

class CommitteeMemberBase(BaseModel):
    user_id: str
    position: str
    committee_id: int
    priority: int = 10
    
class CommitteeMemberCreate(CommitteeMemberBase):
    pass

class CommitteeMemberUpdate(BaseModel):
    position: Optional[str] = None
    committee_id: Optional[int] = None
    priority: Optional[int] = None
    isActive: Optional[bool] = None

class CommitteeMemberPublic(BaseModel):
    id: int
    user_id: str
    fullName: str
    photoUrl: Optional[str] = None
    position: str
    committee: CommitteeOut
    priority: int
    
    class Config:
        from_attributes = True

# --- EXTRAS ---
