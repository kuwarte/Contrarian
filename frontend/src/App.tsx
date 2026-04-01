import React, { useState, useEffect, useCallback } from "react";
import {
	ThumbsDown,
	ThumbsUp,
	Flame,
	MessageSquarePlus,
	User,
	Coffee,
	Monitor,
	Clapperboard,
	Trophy,
	Sun,
	Moon,
	Share2,
	Loader2,
	Award,
} from "lucide-react";

// Import your API and Types
import { api, getDeviceId } from "./api";
import { Opinion, VoteType } from "./types";

// --- CONSTANTS (Synced with your Supabase UUIDs) ---
const CATEGORIES = [
	{
		id: "ce377890-bd2e-4b8f-9cfc-294b5a9578ee",
		name: "Tech",
		icon: Monitor,
		color: "text-indigo-500",
		bg: "bg-indigo-500/10 border-indigo-500/20",
	},
	{
		id: "85c1aab9-e75c-48d8-a217-ac265479e4c8",
		name: "Gaming",
		icon: Trophy,
		color: "text-rose-500",
		bg: "bg-rose-500/10 border-rose-500/20",
	},
	{
		id: "ddbd40fd-3219-4ea4-990e-a6858da98d27",
		name: "Food",
		icon: Coffee,
		color: "text-amber-500",
		bg: "bg-amber-500/10 border-amber-500/20",
	},
	{
		id: "a759211d-222c-4365-85bf-47a3fe299543",
		name: "Movies",
		icon: Clapperboard,
		color: "text-purple-500",
		bg: "bg-purple-500/10 border-purple-500/20",
	},
	{
		id: "58cadd70-4587-457e-a971-302a07e6ca78",
		name: "Music",
		icon: Flame,
		color: "text-emerald-500",
		bg: "bg-emerald-500/10 border-emerald-500/20",
	},
	{
		id: "89c96951-cf3d-4046-9fac-bc5420c8c550",
		name: "Lifestyle",
		icon: User,
		color: "text-sky-500",
		bg: "bg-sky-500/10 border-sky-500/20",
	},
];

// --- SHARED UI COMPONENTS ---
const GlassCard = ({
	children,
	className = "",
	isDark,
}: {
	children: React.ReactNode;
	className?: string;
	isDark: boolean;
}) => (
	<div
		className={`backdrop-blur-xl border transition-all duration-300 rounded-[2rem] ${
			isDark
				? "bg-slate-900/40 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
				: "bg-white/70 border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
		} ${className}`}
	>
		{children}
	</div>
);

const ThemeToggle = ({
	isDark,
	setIsDark,
}: {
	isDark: boolean;
	setIsDark: (v: boolean) => void;
}) => {
	const Icon = isDark ? Sun : Moon;
	return (
		<button
			onClick={() => setIsDark(!isDark)}
			className={`p-2.5 rounded-xl border transition-all duration-300 ${
				isDark
					? "bg-slate-800 border-white/10 text-amber-400 hover:bg-slate-700"
					: "bg-white border-slate-200 text-indigo-600 hover:bg-slate-50 shadow-sm"
			}`}
		>
			<Icon className="w-5 h-5" />
		</button>
	);
};

// --- SUB-VIEWS ---

const ProfileView = ({ isDark, opinions }: { isDark: boolean; opinions: Opinion[] }) => {
	const deviceId = getDeviceId();

	// Filter opinions created by this device
	const myTakes = opinions.filter((op) => op.author_device_id === deviceId);
	const avgHeat =
		myTakes.length > 0
			? Math.round(
					myTakes.reduce((acc, curr) => acc + curr.unpopularity_pct, 0) / myTakes.length
				)
			: 0;

	return (
		<div className="max-w-2xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			<GlassCard isDark={isDark} className="p-10 text-center relative overflow-hidden">
				<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500"></div>
				<div
					className={`w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center border-2 rotate-3 ${isDark ? "bg-slate-800 border-white/10 text-white" : "bg-white border-slate-100 shadow-xl text-slate-900"}`}
				>
					<User className="w-10 h-10" />
				</div>
				<h2 className="text-3xl font-black mb-2 tracking-tight">Anonymous Creator</h2>
				<p className="text-slate-500 font-bold text-xs tracking-[0.2em] uppercase opacity-60">
					ID: {deviceId.substring(0, 12)}
				</p>
			</GlassCard>

			<div className="grid grid-cols-2 gap-4">
				<GlassCard isDark={isDark} className="p-8 text-center">
					<Flame className="w-6 h-6 text-orange-500 mx-auto mb-3" />
					<div className="text-3xl font-black">{myTakes.length}</div>
					<div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">
						Takes Published
					</div>
				</GlassCard>
				<GlassCard isDark={isDark} className="p-8 text-center">
					<Award className="w-6 h-6 text-indigo-500 mx-auto mb-3" />
					<div className="text-3xl font-black">{avgHeat}%</div>
					<div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">
						Avg Heat Score
					</div>
				</GlassCard>
			</div>

			<h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mt-8 mb-4 ml-4">
				My Recent Takes
			</h3>
			{myTakes.length === 0 ? (
				<p className="text-center py-10 text-slate-500 font-medium italic">
					You haven't posted any unpopular opinions yet.
				</p>
			) : (
				myTakes.map((op) => (
					<OpinionCard key={op.id} opinion={op} isDark={isDark} onUpdate={() => {}} />
				))
			)}
		</div>
	);
};

const PostComposer = ({
	isDark,
	onPostSuccess,
}: {
	isDark: boolean;
	onPostSuccess: (op: Opinion) => void;
}) => {
	const [take, setTake] = useState("");
	const [selectedCat, setSelectedCat] = useState(CATEGORIES[0].id);
	const [isPublishing, setIsPublishing] = useState(false);

	const handlePublish = async () => {
		if (take.trim().length < 10 || isPublishing) return;
		setIsPublishing(true);
		try {
			const newOp = await api.createTake(take, selectedCat);
			onPostSuccess(newOp);
			setTake("");
		} catch (err) {
			alert("Failed to publish. Ensure you have a stable connection.");
		} finally {
			setIsPublishing(false);
		}
	};

	return (
		<GlassCard isDark={isDark} className="p-6 md:p-8 mb-8 overflow-hidden relative">
			<div className="flex items-center gap-2 mb-6">
				<div
					className={`p-2 rounded-lg ${isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}
				>
					<MessageSquarePlus className="w-4 h-4" />
				</div>
				<h2
					className={`text-xs font-black tracking-[0.2em] uppercase ${isDark ? "text-slate-400" : "text-slate-500"}`}
				>
					Drop a Take
				</h2>
			</div>
			<textarea
				value={take}
				onChange={(e) => setTake(e.target.value)}
				placeholder="What's your most controversial truth?"
				className={`w-full bg-transparent text-xl md:text-2xl font-bold resize-none outline-none min-h-[120px] leading-tight transition-colors ${isDark ? "text-white placeholder-slate-700" : "text-slate-900 placeholder-slate-300"}`}
			/>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-6 pt-6 border-t border-slate-500/10">
				<div className="flex flex-wrap gap-2">
					{CATEGORIES.map((cat) => (
						<button
							key={cat.id}
							onClick={() => setSelectedCat(cat.id)}
							className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
								selectedCat === cat.id
									? `${cat.bg} ${cat.color} border-current`
									: isDark
										? "bg-white/5 text-slate-500 border-white/5 hover:bg-white/10"
										: "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
							}`}
						>
							{cat.name}
						</button>
					))}
				</div>
				<button
					onClick={handlePublish}
					disabled={take.trim().length < 10 || isPublishing}
					className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all duration-300 flex items-center gap-2 ${
						take.trim().length >= 10
							? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95"
							: "bg-slate-500/10 text-slate-500 cursor-not-allowed border border-slate-500/5"
					}`}
				>
					{isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Take"}
				</button>
			</div>
		</GlassCard>
	);
};

const OpinionCard = ({
	opinion,
	isDark,
	onUpdate,
}: {
	opinion: Opinion;
	isDark: boolean;
	onUpdate: (id: string, stats: any) => void;
}) => {
	const catDetails = CATEGORIES.find((c) => c.id === opinion.category_id) || CATEGORIES[0];
	const unpopularPercent = opinion.unpopularity_pct;

	const handleVote = async (type: VoteType) => {
		try {
			const updatedStats = await api.vote(opinion.id, type);
			onUpdate(opinion.id, updatedStats);
		} catch (err: any) {
			alert(err.message);
		}
	};

	return (
		<GlassCard
			isDark={isDark}
			className="p-6 md:p-8 mb-6 group hover:translate-y-[-4px] transition-transform duration-500"
		>
			<div className="flex items-start justify-between mb-6">
				<div className="flex items-center gap-4">
					<div
						className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${isDark ? "bg-slate-800 border-white/10 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}
					>
						<span className="text-sm font-black">
							{opinion.avatar_seed.substring(0, 2).toUpperCase()}
						</span>
					</div>
					<div>
						<div className="flex items-center gap-2 mb-0.5">
							<span
								className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}
							>
								{opinion.anonymous_name}
							</span>
							<span className="text-[10px] font-black uppercase text-slate-500 opacity-60">
								Just Now
							</span>
						</div>
						<span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
							{opinion.tier}
						</span>
					</div>
				</div>
				<div
					className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${catDetails.bg} ${catDetails.color}`}
				>
					<catDetails.icon className="w-3 h-3" /> {catDetails.name}
				</div>
			</div>
			<p
				className={`text-xl md:text-2xl font-bold leading-tight mb-10 ${isDark ? "text-slate-100" : "text-slate-800"}`}
			>
				"{opinion.content}"
			</p>
			<div className="flex flex-col gap-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<button
							onClick={() => handleVote("unpopular")}
							className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] transition-all border ${isDark ? "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10" : "bg-white text-slate-500 border-slate-200 hover:border-rose-500/50"}`}
						>
							<ThumbsDown className="w-4 h-4 text-rose-500" /> UNPOPULAR{" "}
							{opinion.votes_unpopular}
						</button>
						<button
							onClick={() => handleVote("common")}
							className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] transition-all border ${isDark ? "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10" : "bg-white text-slate-500 border-slate-200 hover:border-emerald-500/50"}`}
						>
							<ThumbsUp className="w-4 h-4 text-emerald-500" /> COMMON{" "}
							{opinion.votes_common}
						</button>
					</div>
					<button
						className={`p-3 rounded-xl transition-colors ${isDark ? "hover:bg-white/5 text-slate-500" : "hover:bg-slate-100 text-slate-400"}`}
					>
						<Share2 className="w-4 h-4" />
					</button>
				</div>
				<div className="space-y-3">
					<div className="flex items-center justify-between mb-1">
						<span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
							Heat Meter
						</span>
						<span
							className={`text-sm font-black ${isDark ? "text-slate-300" : "text-slate-900"}`}
						>
							{unpopularPercent}% Unpopular
						</span>
					</div>
					<div
						className={`h-3 w-full rounded-full overflow-hidden p-0.5 border transition-colors ${isDark ? "bg-slate-950 border-white/5" : "bg-slate-100 border-slate-200/50"}`}
					>
						<div
							className={`h-full rounded-full transition-all duration-1000 ease-out ${unpopularPercent > 70 ? "bg-rose-500" : unpopularPercent > 40 ? "bg-amber-500" : "bg-emerald-500"}`}
							style={{ width: `${unpopularPercent}%` }}
						/>
					</div>
				</div>
			</div>
		</GlassCard>
	);
};

// --- MAIN APPLICATION ---
export default function App() {
	const [activeTab, setActiveTab] = useState("feed");
	const [isDark, setIsDark] = useState(false);
	const [opinions, setOpinions] = useState<Opinion[]>([]);
	const [loading, setLoading] = useState(true);

	const loadFeed = useCallback(async () => {
		setLoading(true);
		try {
			const data = await api.fetchFeed();
			setOpinions(data);
		} catch (err) {
			console.error("Feed error:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadFeed();
		const saved = localStorage.getItem("theme");
		if (saved) setIsDark(saved === "dark");
	}, [loadFeed]);

	useEffect(() => {
		localStorage.setItem("theme", isDark ? "dark" : "light");
	}, [isDark]);

	const handleUpdateOpinion = (id: string, newStats: Partial<Opinion>) => {
		setOpinions((prev) => prev.map((op) => (op.id === id ? { ...op, ...newStats } : op)));
	};

	return (
		<div
			className={`min-h-screen font-sans selection:bg-indigo-500/30 transition-colors duration-500 relative z-0 overflow-x-hidden ${isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}
		>
			{/* Background Blobs */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
				<div
					className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] blur-[120px] rounded-full transition-colors duration-700 ${isDark ? "bg-indigo-900/20" : "bg-indigo-100/50"}`}
				></div>
				<div
					className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full transition-colors duration-700 ${isDark ? "bg-rose-900/10" : "bg-rose-100/40"}`}
				></div>
			</div>

			<nav
				className={`sticky top-0 z-50 w-full px-4 py-4 backdrop-blur-2xl border-b ${isDark ? "bg-slate-950/80 border-white/5" : "bg-white/60 border-slate-200/50"}`}
			>
				<div className="max-w-6xl mx-auto flex items-center justify-between">
					<span
						onClick={() => setActiveTab("feed")}
						className={`text-2xl font-black tracking-tighter cursor-pointer ${isDark ? "text-white" : "text-slate-900"}`}
					>
						contrarian.
					</span>
					<div
						className={`hidden md:flex items-center p-1 rounded-2xl border ${isDark ? "bg-white/5 border-white/5" : "bg-slate-100 border-slate-200/50"}`}
					>
						{[
							{ id: "feed", label: "Feed", icon: Flame },
							{ id: "leaderboard", label: "Rankings", icon: Trophy },
							{ id: "profile", label: "Profile", icon: User },
						].map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? (isDark ? "bg-white/10 text-white shadow-lg" : "bg-white text-slate-900 shadow-sm border border-slate-200/50") : isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
							>
								<tab.icon className="w-4 h-4" />
								{tab.label}
							</button>
						))}
					</div>
					<div className="flex items-center gap-3">
						<ThemeToggle isDark={isDark} setIsDark={setIsDark} />
						<div
							className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isDark ? "bg-white/10 border-white/20" : "bg-slate-900 border-slate-900"}`}
						>
							<span className="text-[10px] font-black text-white">YOU</span>
						</div>
					</div>
				</div>
			</nav>

			<main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
				{activeTab === "feed" && (
					<div className="flex flex-col lg:flex-row gap-12 animate-in fade-in duration-700">
						<div className="flex-1 max-w-2xl w-full mx-auto lg:mx-0">
							<PostComposer
								isDark={isDark}
								onPostSuccess={(newOp) => setOpinions([newOp, ...opinions])}
							/>
							{loading ? (
								<div className="flex justify-center py-20">
									<Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
								</div>
							) : (
								<div className="space-y-4">
									{opinions.map((op) => (
										<OpinionCard
											key={op.id}
											opinion={op}
											isDark={isDark}
											onUpdate={handleUpdateOpinion}
										/>
									))}
								</div>
							)}
						</div>
					</div>
				)}

				{activeTab === "leaderboard" && (
					<div className="flex flex-col items-center justify-center py-32 text-center animate-in zoom-in-95 duration-500">
						<Trophy className="w-16 h-16 text-amber-500 mb-8" />
						<h2 className="text-5xl font-black mb-4 tracking-tight">World Rankings</h2>
						<p className="text-slate-500 text-lg max-w-md font-medium">
							Calculation in progress... Check back soon!
						</p>
					</div>
				)}

				{activeTab === "profile" && <ProfileView isDark={isDark} opinions={opinions} />}
			</main>
		</div>
	);
}
