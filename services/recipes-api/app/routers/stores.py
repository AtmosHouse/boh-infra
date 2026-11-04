"""API routes for store management."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import Store
from app.models import StoreCreate, StoreListResponse, StoreResponse, StoreUpdate

router = APIRouter(prefix="/stores", tags=["stores"])


@router.get("", response_model=StoreListResponse)
async def list_stores(db: AsyncSession = Depends(get_db)) -> StoreListResponse:
    """List all stores."""
    result = await db.execute(select(Store).order_by(Store.name))
    stores = result.scalars().all()
    return StoreListResponse(
        stores=[StoreResponse.model_validate(s) for s in stores],
        total=len(stores),
    )


@router.post("", response_model=StoreResponse, status_code=201)
async def create_store(
    store_data: StoreCreate,
    db: AsyncSession = Depends(get_db),
) -> StoreResponse:
    """Create a new store."""
    # Check if store with same name exists
    existing = await db.execute(
        select(Store).where(Store.name.ilike(store_data.name))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Store with this name already exists")

    store = Store(name=store_data.name)
    db.add(store)
    await db.commit()
    await db.refresh(store)
    return StoreResponse.model_validate(store)


@router.get("/{store_id}", response_model=StoreResponse)
async def get_store(
    store_id: int,
    db: AsyncSession = Depends(get_db),
) -> StoreResponse:
    """Get a store by ID."""
    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return StoreResponse.model_validate(store)


@router.put("/{store_id}", response_model=StoreResponse)
async def update_store(
    store_id: int,
    store_data: StoreUpdate,
    db: AsyncSession = Depends(get_db),
) -> StoreResponse:
    """Update a store."""
    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    if store_data.name is not None:
        # Check for duplicate name
        existing = await db.execute(
            select(Store).where(Store.name.ilike(store_data.name), Store.id != store_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Store with this name already exists")
        store.name = store_data.name

    await db.commit()
    await db.refresh(store)
    return StoreResponse.model_validate(store)


@router.delete("/{store_id}", status_code=204)
async def delete_store(
    store_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a store."""
    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    await db.delete(store)
    await db.commit()

