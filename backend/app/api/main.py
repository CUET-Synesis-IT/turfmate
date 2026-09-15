from fastapi import APIRouter
from app.api.routes import auth, courts, users, venues

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(venues.router)
api_router.include_router(courts.router)
