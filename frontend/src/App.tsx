import React, { useState, useEffect } from "react";
import {
	ThumbsDown,
	ThumbsUp,
	Flame,
	TrendingUp,
	MessageSquarePlus,
	User,
	ChevronRight,
	Coffee,
	Briefcase,
	Monitor,
	Clapperboard,
	Trophy,
	MoreHorizontal,
	Sun,
	Moon,
	Share2,
	Bookmark,
	Award,
} from "lucide-react";

// --- THEME CONSTANTS ---
const CATEGORIES = [
	{
		id: "tech",
		name: "Tech",
		icon: Monitor,
		color: "text-indigo-500",
		bg: "bg-indigo-500/10 border-indigo-500/20",
	},
	{
		id: "culture",
		name: "Culture",
		icon: Clapperboard,
		color: "text-rose-500",
		bg: "bg-rose-500/10 border-rose-500/20",
	},
	{
		id: "work",
		name: "Work",
		icon: Briefcase,
		color: "text-emerald-500",
		bg: "bg-emerald-500/10 border-emerald-500/20",
	},
	{
		id: "life",
		name: "Life",
		icon: Coffee,
		color: "text-amber-500",
		bg: "bg-amber-500/10 border-amber-500/20",
	},
];

const MOCK_OPINIONS = [
	{
		id: "1",
		author: "CitizenZero",
		avatar: "CZ",
		category: "culture",
		time: "2h ago",
		content:
			'The "golden age of television" is over. Shows now prioritize 10-hour cinematic padding over tight, episodic storytelling. I miss when TV was just TV.',
		votesUnpopular: 845,
		votesCommon: 112,
		score: 88,
		tier: "Contrarian God",
	},
	{
		id: "2",
		author: "NullPointer",
		avatar: "NP",
		category: "tech",
		time: "4h ago",
		content:
			"AI isn't going to take your job, but it has completely ruined the internet search experience. Every result is now SEO-optimized slop.",
		votesUnpopular: 230,
		votesCommon: 1450,
		score: 13,
		tier: "Normie",
	},
	{
		id: "3",
		author: "CorporateRebel",
		avatar: "CR",
		category: "work",
		time: "5h ago",
		content:
			"Open-plan offices are a failed psychological experiment. They don't foster collaboration; they just force everyone to wear noise-canceling headphones for 8 hours a day.",
		votesUnpopular: 105,
		votesCommon: 3400,
		score: 3,
		tier: "Normie",
	},
];

// --- SHARED UI COMPONENTS ---

const GlassCard = ({ children, className = "", isDark }) => (
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

const ThemeToggle = ({ isDark, setIsDark }) => (
	<button
		onClick={() => setIsDark(!isDark)}
		className={`p-2.5 rounded-xl border transition-all duration-300 ${
			isDark
				? "bg-slate-800 border-white/10 text-amber-400 hover:bg-slate-700"
				: "bg-white border-slate-200 text-indigo-600 hover:bg-slate-50 shadow-sm"
		}`}
	>
		{isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
	</button>
);

const Navbar = ({ activeTab, setActiveTab, isDark, setIsDark }) => {
	const tabs = [
		{ id: "feed", label: "Feed", icon: Flame },
		{ id: "leaderboard", label: "Rankings", icon: Trophy },
		{ id: "profile", label: "Profile", icon: User },
	];

	return (
		<nav
			className={`sticky top-0 z-50 w-full px-4 py-4 md:py-5 transition-colors duration-300 border-b ${
				isDark ? "bg-slate-950/80 border-white/5" : "bg-white/60 border-slate-200/50"
			} backdrop-blur-2xl`}
		>
			<div className="max-w-6xl mx-auto flex items-center justify-between">
				<div
					className="flex items-center cursor-pointer select-none"
					onClick={() => setActiveTab("feed")}
				>
					<span
						className={`text-2xl font-black tracking-tighter lowercase ${
							isDark ? "text-white" : "text-slate-900"
						}`}
					>
						contrarian.
					</span>
				</div>

				<div
					className={`hidden md:flex items-center p-1 gap-1 rounded-2xl border transition-colors ${
						isDark ? "bg-white/5 border-white/5" : "bg-slate-100 border-slate-200/50"
					}`}
				>
					{tabs.map((tab) => {
						const Icon = tab.icon;
						const isActive = activeTab === tab.id;
						return (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
									isActive
										? isDark
											? "bg-white/10 text-white shadow-lg"
											: "bg-white text-slate-900 shadow-sm border border-slate-200/50"
										: isDark
											? "text-slate-400 hover:text-white"
											: "text-slate-500 hover:text-slate-900"
								}`}
							>
								<Icon className="w-4 h-4" />
								{tab.label}
							</button>
						);
					})}
				</div>

				<div className="flex items-center gap-3">
					<ThemeToggle isDark={isDark} setIsDark={setIsDark} />
					<div
						className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-all border-2 ${
							isDark
								? "bg-white/10 border-white/20"
								: "bg-slate-900 border-white shadow-sm"
						}`}
					>
						<span
							className={`text-[10px] font-black tracking-widest ${isDark ? "text-white" : "text-white"}`}
						>
							YOU
						</span>
					</div>
				</div>
			</div>
		</nav>
	);
};

// --- FEED COMPONENTS ---

const PostComposer = ({ isDark }) => {
	const [take, setTake] = useState("");
	const [selectedCat, setSelectedCat] = useState("tech");

	return (
		<GlassCard isDark={isDark} className="p-6 md:p-8 mb-8 overflow-hidden relative">
			<div className="flex items-center gap-2 mb-6">
				<div className={`p-2 rounded-lg ${isDark ? "bg-indigo-500/20" : "bg-indigo-50"}`}>
					<MessageSquarePlus className="w-4 h-4 text-indigo-500" />
				</div>
				<h2
					className={`text-xs font-black tracking-[0.2em] uppercase ${isDark ? "text-slate-400" : "text-slate-500"}`}
				>
					New Take
				</h2>
			</div>

			<textarea
				value={take}
				onChange={(e) => setTake(e.target.value)}
				placeholder="What's your most controversial truth?"
				className={`w-full bg-transparent text-xl md:text-2xl font-bold resize-none outline-none min-h-[100px] leading-tight transition-colors ${
					isDark
						? "text-white placeholder-slate-700"
						: "text-slate-900 placeholder-slate-300"
				}`}
			/>

			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-6 pt-6 border-t border-slate-500/10">
				<div className="flex flex-wrap gap-2">
					{CATEGORIES.map((cat) => (
						<button
							key={cat.id}
							onClick={() => setSelectedCat(cat.id)}
							className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
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
					className={`px-8 py-3 rounded-2xl text-sm font-black transition-all duration-300 ${
						take.trim().length > 5
							? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95"
							: "bg-slate-500/10 text-slate-500 cursor-not-allowed border border-slate-500/5"
					}`}
				>
					Publish Take
				</button>
			</div>
		</GlassCard>
	);
};

const OpinionCard = ({ opinion, isDark }) => {
	const [vote, setVote] = useState(null);
	const catDetails = CATEGORIES.find((c) => c.id === opinion.category) || CATEGORIES[0];
	const totalVotes = opinion.votesUnpopular + opinion.votesCommon + (vote ? 1 : 0);
	const currentUnpopular = opinion.votesUnpopular + (vote === "unpopular" ? 1 : 0);
	const unpopularPercent =
		totalVotes === 0 ? 0 : Math.round((currentUnpopular / totalVotes) * 100);

	return (
		<GlassCard
			isDark={isDark}
			className="p-6 md:p-8 mb-6 group hover:translate-y-[-4px] transition-transform duration-500"
		>
			<div className="flex items-start justify-between mb-6">
				<div className="flex items-center gap-4">
					<div
						className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm transition-colors ${
							isDark ? "bg-slate-800 border-white/10" : "bg-slate-50 border-slate-200"
						}`}
					>
						<span
							className={`text-sm font-black ${isDark ? "text-slate-400" : "text-slate-600"}`}
						>
							{opinion.avatar}
						</span>
					</div>
					<div>
						<div className="flex items-center gap-2 mb-0.5">
							<span
								className={`font-black ${isDark ? "text-white" : "text-slate-900"}`}
							>
								{opinion.author}
							</span>
							<span
								className={`w-1 h-1 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-300"}`}
							></span>
							<span className="text-xs font-bold text-slate-500 uppercase">
								{opinion.time}
							</span>
						</div>
						<span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 opacity-80">
							{opinion.tier}
						</span>
					</div>
				</div>

				<div
					className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-colors ${catDetails.bg} ${catDetails.color}`}
				>
					<catDetails.icon className="w-3.5 h-3.5" />
					{catDetails.name}
				</div>
			</div>

			<p
				className={`text-xl md:text-2xl font-bold leading-tight mb-10 transition-colors ${
					isDark ? "text-slate-100" : "text-slate-800"
				}`}
			>
				"{opinion.content}"
			</p>

			<div className="flex flex-col gap-8">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<button
							onClick={() => setVote(vote === "unpopular" ? null : "unpopular")}
							className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all duration-300 border ${
								vote === "unpopular"
									? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20 scale-105"
									: isDark
										? "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
										: "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
							}`}
						>
							<ThumbsDown className="w-4 h-4" />
							<span>
								UNPOPULAR {opinion.votesUnpopular + (vote === "unpopular" ? 1 : 0)}
							</span>
						</button>

						<button
							onClick={() => setVote(vote === "common" ? null : "common")}
							className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all duration-300 border ${
								vote === "common"
									? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20 scale-105"
									: isDark
										? "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10"
										: "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
							}`}
						>
							<ThumbsUp className="w-4 h-4" />
							<span>COMMON {opinion.votesCommon + (vote === "common" ? 1 : 0)}</span>
						</button>
					</div>

					<div className="flex items-center gap-2">
						<button
							className={`p-3 rounded-xl transition-colors ${isDark ? "hover:bg-white/5 text-slate-500" : "hover:bg-slate-100 text-slate-400"}`}
						>
							<Share2 className="w-4 h-4" />
						</button>
						<button
							className={`p-3 rounded-xl transition-colors ${isDark ? "hover:bg-white/5 text-slate-500" : "hover:bg-slate-100 text-slate-400"}`}
						>
							<Bookmark className="w-4 h-4" />
						</button>
					</div>
				</div>

				<div className="space-y-3">
					<div className="flex items-center justify-between mb-1">
						<span
							className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}
						>
							Heat Meter
						</span>
						<span
							className={`text-sm font-black ${isDark ? "text-slate-300" : "text-slate-900"}`}
						>
							{unpopularPercent}% Unpopular
						</span>
					</div>
					<div
						className={`h-4 w-full rounded-full overflow-hidden p-1 border shadow-inner transition-colors ${
							isDark
								? "bg-slate-950 border-white/5"
								: "bg-slate-100 border-slate-200/50"
						}`}
					>
						<div
							className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
								unpopularPercent > 70
									? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
									: unpopularPercent > 40
										? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]"
										: "bg-emerald-500"
							}`}
							style={{ width: `${unpopularPercent}%` }}
						>
							<div className="absolute inset-0 bg-white/20 blur-[1px]"></div>
						</div>
					</div>
				</div>
			</div>
		</GlassCard>
	);
};

// --- SIDEBAR & VIEWS ---

const TrendingPanel = ({ isDark }) => (
	<GlassCard isDark={isDark} className="p-8 sticky top-28">
		<div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
			<div className={`p-2 rounded-lg ${isDark ? "bg-rose-500/20" : "bg-rose-50"}`}>
				<Flame className="w-4 h-4 text-rose-500" />
			</div>
			<h3
				className={`text-xs font-black tracking-[0.2em] uppercase ${isDark ? "text-white" : "text-slate-800"}`}
			>
				Global Heat
			</h3>
		</div>

		<div className="space-y-8">
			{[1, 2, 3].map((index) => (
				<div key={index} className="group cursor-pointer">
					<div className="flex items-start gap-4">
						<span
							className={`text-2xl font-black transition-colors leading-none ${
								isDark
									? "text-slate-800 group-hover:text-slate-600"
									: "text-slate-100 group-hover:text-slate-200"
							}`}
						>
							{index}
						</span>
						<div>
							<p
								className={`text-sm font-bold leading-tight mb-2 line-clamp-2 transition-colors ${
									isDark
										? "text-slate-300 group-hover:text-white"
										: "text-slate-700 group-hover:text-slate-950"
								}`}
							>
								{index === 1
									? "Traveling is largely a status game for the Instagram grid."
									: index === 2
										? "Dark mode is actually terrible for reading long-form text."
										: "The 40-hour work week is a relic of the industrial age."}
							</p>
							<div className="flex items-center gap-1.5">
								<span
									className={`text-[10px] font-black uppercase tracking-wider ${isDark ? "text-rose-400" : "text-rose-500"}`}
								>
									{98 - index * 5}% Heat
								</span>
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	</GlassCard>
);

const ProfileView = ({ isDark }) => (
	<div className="max-w-4xl mx-auto space-y-8">
		<GlassCard isDark={isDark} className="p-10 relative overflow-hidden">
			<div
				className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] opacity-20 pointer-events-none -translate-y-1/2 translate-x-1/2 ${
					isDark ? "bg-indigo-500" : "bg-indigo-200"
				}`}
			></div>

			<div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
				<div
					className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center border-4 rotate-3 transition-colors ${
						isDark
							? "bg-slate-800 border-white/10"
							: "bg-slate-900 border-white shadow-xl"
					}`}
				>
					<span className="text-3xl font-black text-white tracking-widest">YOU</span>
				</div>

				<div className="flex-1 text-center md:text-left pt-2">
					<div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
						<h2
							className={`text-4xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}
						>
							Anonymous Hero
						</h2>
						<div
							className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border text-xs font-black uppercase tracking-widest ${
								isDark
									? "bg-amber-500/10 border-amber-500/20 text-amber-500"
									: "bg-amber-50 border-amber-200 text-amber-700"
							}`}
						>
							<Award className="w-3.5 h-3.5" />
							Contrarian God
						</div>
					</div>
					<p
						className={`text-lg font-medium max-w-xl mb-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}
					>
						Professional non-conformist. Here to challenge the consensus and drop truths
						that make people uncomfortable.
					</p>

					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
						{[
							{
								label: "Heat Score",
								val: "88%",
								icon: Flame,
								color: "text-rose-500",
							},
							{
								label: "Takes",
								val: "24",
								icon: MessageSquarePlus,
								color: "text-indigo-500",
							},
							{
								label: "Votes",
								val: "1.2k",
								icon: ThumbsDown,
								color: "text-amber-500",
							},
							{ label: "Rank", val: "#42", icon: Trophy, color: "text-emerald-500" },
						].map((stat, i) => (
							<div
								key={i}
								className={`p-4 rounded-2xl border transition-colors ${
									isDark
										? "bg-white/5 border-white/5"
										: "bg-slate-50 border-slate-100"
								}`}
							>
								<stat.icon className={`w-4 h-4 mb-2 ${stat.color}`} />
								<p
									className={`text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
								>
									{stat.val}
								</p>
								<p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
									{stat.label}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</GlassCard>

		<div className="space-y-6">
			<h3
				className={`text-xs font-black tracking-[0.2em] uppercase px-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}
			>
				Your Past Takes
			</h3>
			<OpinionCard opinion={MOCK_OPINIONS[0]} isDark={isDark} />
		</div>
	</div>
);

// --- MAIN APPLICATION ---

export default function App() {
	const [activeTab, setActiveTab] = useState("feed");
	const [isDark, setIsDark] = useState(false);

	// Persistence of theme
	useEffect(() => {
		const saved = localStorage.getItem("theme");
		if (saved) setIsDark(saved === "dark");
		else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setIsDark(true);
	}, []);

	useEffect(() => {
		localStorage.setItem("theme", isDark ? "dark" : "light");
	}, [isDark]);

	return (
		<div
			className={`min-h-screen font-sans selection:bg-indigo-500/30 transition-colors duration-500 relative z-0 overflow-x-hidden ${
				isDark ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
			}`}
		>
			{/* Dynamic Background Elements */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
				<div
					className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] blur-[120px] rounded-full transition-colors duration-700 ${
						isDark ? "bg-indigo-900/20" : "bg-indigo-100/50"
					}`}
				></div>
				<div
					className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full transition-colors duration-700 ${
						isDark ? "bg-rose-900/10" : "bg-rose-100/40"
					}`}
				></div>
				<div
					className={`absolute top-[30%] left-[30%] w-[40%] h-[40%] blur-[120px] rounded-full transition-colors duration-700 ${
						isDark ? "bg-slate-900/40" : "bg-slate-50"
					}`}
				></div>
			</div>

			<Navbar
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				isDark={isDark}
				setIsDark={setIsDark}
			/>

			<main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
				{activeTab === "feed" && (
					<div className="flex flex-col lg:flex-row gap-12">
						<div className="flex-1 max-w-2xl w-full mx-auto lg:mx-0">
							<PostComposer isDark={isDark} />
							<div className="space-y-4">
								{MOCK_OPINIONS.map((op) => (
									<OpinionCard key={op.id} opinion={op} isDark={isDark} />
								))}
							</div>
						</div>

						<div className="hidden lg:block w-80 shrink-0">
							<TrendingPanel isDark={isDark} />
						</div>
					</div>
				)}

				{activeTab === "leaderboard" && (
					<div className="flex flex-col items-center justify-center py-32 text-center">
						<Trophy className="w-16 h-16 text-amber-500 mb-8" />
						<h2 className="text-5xl font-black mb-4 tracking-tight">World Rankings</h2>
						<p className="text-slate-500 text-lg max-w-md font-medium">
							Coming soon. We're currently calculating the most controversial humans
							on the planet.
						</p>
					</div>
				)}

				{activeTab === "profile" && <ProfileView isDark={isDark} />}
			</main>

			{/* Floating Action for Mobile */}
			<button className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-500 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-95 transition-transform z-50">
				<MessageSquarePlus className="w-6 h-6" />
			</button>
		</div>
	);
}
