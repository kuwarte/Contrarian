import { Opinion, UserStats, VoteType } from "../types";

const BASE_URL = "http://127.0.0.1:8000";

export const getDeviceId = (): string => {
	let id = localStorage.getItem("contrarian_device_id");
	if (!id) {
		id = crypto.randomUUID();
		localStorage.setItem("contrarian_device_id", id);
	}
	return id;
};

export const api = {
	async fetchFeed(): Promise<Opinion[]> {
		const res = await fetch(`${BASE_URL}/opinions`);
		return res.json();
	},

	async createTake(content: string, categoryId: string): Promise<Opinion> {
		const payload = {
			content,
			category_id: categoryId,
			author_device_id: getDeviceId(),
			anonymous_name: "Anonymous Hero", // Could be dynamic later
			avatar_seed: Math.random().toString(36).substring(7),
		};
		const res = await fetch(`${BASE_URL}/opinions`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		return res.json();
	},

	async vote(opinionId: string, type: VoteType): Promise<any> {
		const res = await fetch(`${BASE_URL}/votes`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				opinion_id: opinionId,
				device_id: getDeviceId(),
				vote_type: type,
			}),
		});
		if (res.status === 409) throw new Error("Already voted!");
		return res.json();
	},
};
