from fastapi import APIRouter, HTTPException

from app.models import Item, ItemCreate, ItemUpdate

router = APIRouter(prefix="/items", tags=["items"])

# In-memory store – intentional for this sample project.
# In a real application, replace this with a proper database (e.g. SQLAlchemy + PostgreSQL)
# and use dependency injection to provide a session per request.
_db: dict[int, Item] = {}
_next_id: int = 1


@router.get("/", response_model=list[Item])
def list_items() -> list[Item]:
    """Return all items."""
    return list(_db.values())


@router.post("/", response_model=Item, status_code=201)
def create_item(payload: ItemCreate) -> Item:
    """Create a new item."""
    global _next_id
    item = Item(id=_next_id, **payload.model_dump())
    _db[_next_id] = item
    _next_id += 1
    return item


@router.get("/{item_id}", response_model=Item)
def get_item(item_id: int) -> Item:
    """Retrieve a single item by ID."""
    item = _db.get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.put("/{item_id}", response_model=Item)
def update_item(item_id: int, payload: ItemUpdate) -> Item:
    """Update an existing item (partial update supported)."""
    item = _db.get(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    updated_data = item.model_dump()
    for field, value in payload.model_dump(exclude_unset=True).items():
        updated_data[field] = value
    _db[item_id] = Item(**updated_data)
    return _db[item_id]


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: int) -> None:
    """Delete an item by ID."""
    if item_id not in _db:
        raise HTTPException(status_code=404, detail="Item not found")
    del _db[item_id]
