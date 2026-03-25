from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import opinions, votes, leaderboard, score

app = FastAPI(
    title="Contrarian API",
    version="1.0.0",
    description="Backend for Contrarian — anonymous opinion voting platform.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(opinions.router,    prefix="/opinions",    tags=["Opinions"])
app.include_router(votes.router,       prefix="/votes",       tags=["Votes"])
app.include_router(leaderboard.router, prefix="/leaderboard", tags=["Leaderboard"])
app.include_router(score.router,       prefix="/score",       tags=["Score"])


@app.get("/", tags=["Health"])
def root():
    return {"message": "Contrarian API", "status": "running"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
