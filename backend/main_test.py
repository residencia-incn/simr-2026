from fastapi import FastAPI
from routers import accounting

app = FastAPI(title="TEST - Accounting Only")

app.include_router(accounting.router, prefix="/accounting", tags=["Accounting"])

@app.get("/")
def root():
    return {"test": "accounting_only"}
