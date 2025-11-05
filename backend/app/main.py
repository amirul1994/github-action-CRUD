from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional

from . import crud, models, schemas
from .database import engine, get_db
from .cache import cache_response, invalidate_cache

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CRUD API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the CRUD API"}

@app.get("/items/", response_model=schemas.ItemList)
@cache_response(prefix="items_list")
async def read_items(
    skip: int = 0,
    limit: int = 100,
    title_search: Optional[str] = Query(None, min_length=1),
    db: Session = Depends(get_db)
):
    items, total = crud.get_items(db, skip=skip, limit=limit, title_search=title_search)
    return {"items": items, "total": total}

@app.get("/items/{item_id}", response_model=schemas.Item)
@cache_response(prefix="item_detail")
async def read_item(item_id: int, db: Session = Depends(get_db)):
    db_item = crud.get_item(db, item_id=item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item

@app.post("/items/", response_model=schemas.Item, status_code=201)
async def create_item(item: schemas.ItemCreate, db: Session = Depends(get_db)):
    db_item = crud.create_item(db=db, item=item)
    invalidate_cache("items_list")
    return db_item

@app.put("/items/{item_id}", response_model=schemas.Item)
async def update_item(
    item_id: int, item: schemas.ItemUpdate, db: Session = Depends(get_db)
):
    db_item = crud.update_item(db=db, item_id=item_id, item=item)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Invalidate caches
    invalidate_cache("items_list")
    invalidate_cache(f"item_detail:item_id:{item_id}")
    
    return db_item

@app.delete("/items/{item_id}", response_model=schemas.Item)
async def delete_item(item_id: int, db: Session = Depends(get_db)):
    db_item = crud.delete_item(db=db, item_id=item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Invalidate caches
    invalidate_cache("items_list")
    invalidate_cache(f"item_detail:item_id:{item_id}")
    
    return db_item

# Add a health check endpoint
@app.get("/health")
def health_check():
    return {"status": "ok"}