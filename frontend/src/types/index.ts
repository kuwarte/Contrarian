export type VoteType = "unpopular" | "common";

export interface Opinion {
	id: string;
	content: string;
	category_id: string;
	anonymous_name: string;
	avatar_seed: string;
	votes_unpopular: number;
	votes_common: number;
	total_votes: number;
	unpopularity_pct: number;
	tier: string;
	created_at: string;
	author_device_id: string;
}

export interface UserStats {
	total_takes: number;
	total_votes_received: number;
	avg_unpopularity: number;
	global_tier: string;
}
