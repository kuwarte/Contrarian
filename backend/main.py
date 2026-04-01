from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import our routers
from routes import opinions, votes, leaderboard, score

app = FastAPI(title="Contrarian API", description="Backend for the Contrarian voting app")

# --- CORS Settings ---
# Important: Update `allow_origins` in production to your frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # e.g. ["http://localhost:5173", "https://yourdomain.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Register Routes ---
app.include_router(opinions.router)
app.include_router(votes.router)
app.include_router(leaderboard.router)
app.include_router(score.router)

# --- Health Check ---
@app.get("/")
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Contrarian API is up and running!"}
