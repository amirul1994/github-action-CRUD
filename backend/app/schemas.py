from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class ItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_active: Optional[bool] = True

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class Item(ItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ItemList(BaseModel):
    items: List[Item]
    total: int