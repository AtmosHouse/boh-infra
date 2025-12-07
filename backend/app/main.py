"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import dishes, ingredients, recipes, shopping, stores, users

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
Recipe & Shopping List API for managing dinner party ingredients.

## Features

* **Dish Management** - Create and manage dishes with course assignments
* **Ingredient Parsing** - Parse natural language ingredient lists into structured data
* **Shopping List Generation** - Consolidate ingredients into an organized shopping list
* **Recipe Processing** - Process multiple recipes and extract all ingredients
* **Unit Conversion** - Automatic conversion between compatible units

## Usage

1. Create a dish using `/api/v1/dishes`
2. Parse ingredients for a dish using `/api/v1/ingredients/parse`
3. Generate a consolidated shopping list using `/api/v1/shopping/generate`
4. Process multiple recipes at once using `/api/v1/recipes/process`
    """,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # port=8000,
)

# Include routers
app.include_router(dishes.router, prefix="/api/v1")
app.include_router(ingredients.router, prefix="/api/v1")
app.include_router(shopping.router, prefix="/api/v1")
app.include_router(recipes.router, prefix="/api/v1")
app.include_router(stores.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint returning API information."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
    }


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import os

    import uvicorn

    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)
