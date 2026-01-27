from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class RoadmapBase(BaseModel):
    title: str
    date_display: Optional[str] = None
    description: Optional[str] = None
    icon_name: Optional[str] = "Calendar"
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    order: Optional[int] = 0
    sort_date: Optional[datetime] = None

class RoadmapCreate(RoadmapBase):
    pass

class RoadmapUpdate(RoadmapBase):
    title: Optional[str] = None
    date_display: Optional[str] = None
    description: Optional[str] = None
    icon_name: Optional[str] = None
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
    order: Optional[int] = None
    sort_date: Optional[datetime] = None
    isActive: Optional[bool] = None

class Roadmap(RoadmapBase):
    id: str
    isActive: bool = True

    class Config:
        from_attributes = True
