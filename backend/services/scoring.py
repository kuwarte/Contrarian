"""
Shared scoring logic.

Score formula:
  unpopularity_pct = votes_unpopular / total_votes * 100
  Opinions with < MIN_VOTES are excluded from score calculation.

Tiers:
  0  – 30  → Normie
  31 – 60  → Edgy
  61 – 80  → Based
  81 – 100 → Contrarian God
"""

MIN_VOTES = 5  # opinions below this threshold are excluded from score


def compute_tier(score: float) -> str:
    if score <= 30:
        return "Normie"
    elif score <= 60:
        return "Edgy"
    elif score <= 80:
        return "Based"
    else:
        return "Contrarian God"


def compute_opinion_stats(votes_unpopular: int, votes_common: int) -> dict:
    """Return derived stats for a single opinion."""
    total = votes_unpopular + votes_common
    pct = round((votes_unpopular / total * 100), 1) if total > 0 else 0.0
    return {
        "total_votes": total,
        "unpopularity_pct": pct,
        "tier": compute_tier(pct),
    }


def compute_user_score(opinions: list[dict]) -> dict:
    """
    Given a list of opinion dicts (must have votes_unpopular, votes_common),
    return the user's aggregate score and tier.
    """
    qualifying = [
        op for op in opinions
        if (op["votes_unpopular"] + op["votes_common"]) >= MIN_VOTES
    ]

    if not qualifying:
        return {
            "unpopularity_score": 0.0,
            "tier": "Normie",
            "qualifying_opinions": 0,
        }

    avg = sum(
        op["votes_unpopular"] / (op["votes_unpopular"] + op["votes_common"]) * 100
        for op in qualifying
    ) / len(qualifying)

    return {
        "unpopularity_score": round(avg, 1),
        "tier": compute_tier(avg),
        "qualifying_opinions": len(qualifying),
    }
