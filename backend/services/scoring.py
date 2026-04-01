def calculate_tier(unpopularity_pct: float) -> str:
    """Determine the tier based on unpopularity percentage."""
    if unpopularity_pct <= 30:
        return "Normie"
    elif unpopularity_pct <= 60:
        return "Edgy"
    elif unpopularity_pct <= 80:
        return "Based"
    else:
        return "Contrarian God"

def calculate_stats(votes_unpopular: int, votes_common: int) -> tuple[int, float, str]:
    """Calculate derived vote metrics."""
    total_votes = votes_unpopular + votes_common
    unpopularity_pct = (votes_unpopular / total_votes * 100) if total_votes > 0 else 0.0
    tier = calculate_tier(unpopularity_pct)
    return total_votes, round(unpopularity_pct, 1), tier

def enrich_opinion(opinion: dict) -> dict:
    """Takes a raw database opinion row and injects derived statistics."""
    u_votes = opinion.get('votes_unpopular', 0)
    c_votes = opinion.get('votes_common', 0)
    
    total, pct, tier = calculate_stats(u_votes, c_votes)
    
    return {
        **opinion,
        "total_votes": total,
        "unpopularity_pct": pct,
        "tier": tier
    }
