from fastapi import APIRouter
from app.api.routes import auth, businesses, users
from app.schemas.business import BusinessResponse

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(businesses.router)

# Direct alias for GET /all-businesses
api_router.add_api_route(
    "/all-businesses",
    businesses.list_all_businesses,
    methods=["GET"],
    response_model=list[BusinessResponse],
    tags=["businesses"],
    summary="List all active businesses (alias)",
)
