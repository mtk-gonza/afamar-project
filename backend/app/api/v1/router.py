from fastapi import APIRouter

from app.api.v1 import (
    auth,
    budgets,
    clients,
    materials,
    measurements,
    online_budgets,
    options,
    pool_stock,
    reports,
    search,
    settings,
    whatsapp,
    work_orders,
)

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router, prefix="/auth", tags=["Auth"])
router.include_router(clients.router, prefix="/clients", tags=["Clients"])
router.include_router(budgets.router, prefix="/budgets", tags=["Budgets"])
router.include_router(work_orders.router, prefix="/work-orders", tags=["Work Orders"])
router.include_router(materials.router, prefix="/materials", tags=["Materials"])
router.include_router(options.router, prefix="/options", tags=["Options"])
router.include_router(pool_stock.router, prefix="/pool-stock", tags=["Pool Stock"])
router.include_router(reports.router, prefix="/reports", tags=["Reports"])
router.include_router(settings.router, prefix="/settings", tags=["Settings"])
router.include_router(measurements.router, prefix="/measurements", tags=["Measurements"])
router.include_router(online_budgets.router, prefix="/online-budgets", tags=["Online Budgets"])
router.include_router(whatsapp.router, prefix="/whatsapp", tags=["WhatsApp"])
router.include_router(search.router, prefix="/search", tags=["Search"])
