"use client";

import { useState, useEffect } from "react";
import {
  Rocket, DollarSign, TrendingUp, Target, Zap, Globe,
  Briefcase, Wallet, ChevronRight, ExternalLink,
  Activity, Calendar, Award, Gift, CheckCircle2, Circle,
  Dumbbell, Flame, Star, TrendingDown, Cloud, CloudRain,
  CloudSnow, Sun, CloudLightning, Wind, Droplets
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

// === Financial Data ===
const FINANCES = {
  savings: 2000,
  crypto: 10000,
  monthlyCosts: 1000,
  funding: { status: "pending", amount: 12000, expected: "May/June 2026" }
};

// === Projects ===
const PROJECTS = [
  {
    id: "1",
    name: "Benefitsi",
    description: "Rewards & Loyalty App für lokale Geschäfte",
    status: "active",
    priority: "high",
    link: "https://benefitsi-dashboard.vercel.app",
    progress: 75,
    nextAction: "Firebase Rules + Partner Onboarding"
  },
  {
    id: "2",
    name: "Amigo Creator",
    description: "Trading Bot Integration",
    status: "active",
    priority: "high",
    link: null,
    progress: 60,
    nextAction: "Launch abwarten"
  },
  {
    id: "3",
    name: "eWorld Record",
    description: "Abstract Gaming Plattform",
    status: "planning",
    priority: "medium",
    link: null,
    progress: 20,
    nextAction: "Konzept erstellen"
  },
  {
    id: "4",
    name: "Abstract Spiel",
    description: "Eigenes Spiel auf Abstract Blockchain",
    status: "planning",
    priority: "low",
    link: null,
    progress: 10,
    nextAction: "Game Design"
  },
];

// === KPIs ===
const KPIs = [
  { label: "Sparquote", value: "67%", target: "80%", icon: TrendingUp, color: "from-green-500 to-emerald-500" },
  { label: "Daily Progress", value: "87%", target: "100%", icon: Activity, color: "from-blue-500 to-cyan-500" },
  { label: "Funding Chance", value: "TBD", target: "Mai/Jun", icon: Target, color: "from-purple-500 to-pink-500" },
  { label: "Net Worth", value: "€12K", target: "€50K", icon: Wallet, color: "from-amber-500 to-orange-500" },
];

// === Habits ===
const HABITS = [
  { id: "duolingo", label: "Duolingo", emoji: "🇪🇸" },
  { id: "yoga", label: "Yoga", emoji: "🧘" },
  { id: "meditation", label: "Meditation", emoji: "🧘‍♂️" },
  { id: "gym", label: "Gym", emoji: "💪" },
  { id: "lesen", label: "Lesen", emoji: "📚" },
  { id: "creatin", label: "Creatin", emoji: "💊" },
  { id: "pushups", label: "Push-ups", emoji: "💨" },
  { id: "atem", label: "Atemübung", emoji: "🌬️" },
  { id: "smoothie", label: "Smoothie", emoji: "🥤" },
];

// === Bucket List ===
const BUCKET_LIST = [
  { id: "1", text: "1M Euro Net Worth", target: "€1M", icon: "💰" },
  { id: "2", text: "Funding received (€12K/mo)", target: "€12K/mo", icon: "🎯" },
  { id: "3", text: "Successful app launch", target: "Launch", icon: "🚀" },
  { id: "4", text: "Fitness goals achieved", target: "Fit", icon: "💪" },
  { id: "5", text: "eWorld Record game live", target: "Game", icon: "🎮" },
];

export default function MissionControl() {
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "finances" | "tracker">("overview");
  const [habits, setHabits] = useState<Record<string, boolean>>({});
  const [gymStreak, setGymStreak] = useState(0);
  const [gymLogs, setGymLogs] = useState<string[]>([]);
  const [bucketList, setBucketList] = useState<any[]>(BUCKET_LIST);
  const [habitStreaks, setHabitStreaks] = useState<Record<string, { current: number; longest: number; last7: boolean[] }>>({});
  const [newBucketText, setNewBucketText] = useState("");
  const [loading, setLoading] = useState(true);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutType, setWorkoutType] = useState("strength");
  const [workoutDuration, setWorkoutDuration] = useState(60);
  const [workoutIntensity, setWorkoutIntensity] = useState("medium");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [workoutHistory, setWorkoutHistory] = useState<Record<string, { type: string; duration: number; intensity: string; notes?: string }>>({});
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

  // Weather data - Annweiler, Germany
  const [weather, setWeather] = useState<{ temp: number; feels: number; condition: string; humidity: number; wind: number; icon: string } | null>(null);
  const [forecast, setForecast] = useState<Array<{ date: string; min: number; max: number; condition: string; icon: string }>>([]);

  // Load weather on mount
  useEffect(() => {
    async function loadWeather() {
      try {
        const res = await fetch("/api/weather");
        if (res.ok) {
          const data = await res.json();
          setWeather(data.current);
          setForecast(data.forecast || []);
        }
      } catch (e) {
        console.error("Weather load failed", e);
      }
    }
    loadWeather();
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch habits
      const habitsRes = await fetch("/api/habits");
      if (habitsRes.ok) {
        const habitsData = await habitsRes.json();
        const today = new Date().toISOString().split("T")[0];
        setHabits(habitsData.habits?.[today] || {});
      }

      // Fetch gym
      const gymRes = await fetch("/api/gym");
      if (gymRes.ok) {
        const gymData = await gymRes.json();
        setGymStreak(gymData.streak || 0);
        setGymLogs(gymData.logs || []);
        setWorkoutHistory(gymData.workouts || {});
      }

      // Fetch bucket list
      const bucketRes = await fetch("/api/bucketlist");
      if (bucketRes.ok) {
        const bucketData = await bucketRes.json();
        setBucketList(bucketData.items || BUCKET_LIST);
      }

      // Fetch habit streaks
      try {
        const streaksRes = await fetch("/api/streaks");
        if (streaksRes.ok) {
          const streaksData = await streaksRes.json();
          setHabitStreaks(streaksData.streaks || {});
        }
      } catch (e) {
        console.error("Failed to load streaks", e);
      }
    } catch (e) {
      console.error("Failed to load data", e);
    }
    setLoading(false);
  }

  async function toggleHabit(habitId: string) {
    const newValue = !habits[habitId];
    const today = new Date().toISOString().split("T")[0];

    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId, completed: newValue, date: today }),
    });

    if (res.ok) {
      const data = await res.json();
      setHabits(prev => ({ ...prev, [habitId]: newValue }));

      // Update daily progress
      const progressEl = document.querySelector('[data-daily-progress]');
      if (progressEl) {
        progressEl.textContent = `${Math.round((data.completedCount / data.total) * 100)}%`;
      }
    }
  }

  async function logGym() {
    // Open workout modal instead of immediately logging
    setShowWorkoutModal(true);
  }

  async function confirmGymLog() {
    const today = new Date().toISOString().split("T")[0];
    if (gymLogs.includes(today)) return;

    const workout = {
      type: workoutType,
      duration: workoutDuration,
      intensity: workoutIntensity,
      notes: workoutNotes
    };

    const res = await fetch("/api/gym", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: today, workout }),
    });

    if (res.ok) {
      const data = await res.json();
      setGymLogs(prev => [...prev, today].sort());
      setGymStreak(data.streak);
      // Also update local workout history
      setWorkoutHistory(prev => ({
        ...prev,
        [today]: { type: workoutType, duration: workoutDuration, intensity: workoutIntensity, notes: workoutNotes }
      }));
    }
    setShowWorkoutModal(false);
    // Reset form
    setWorkoutType("strength");
    setWorkoutDuration(60);
    setWorkoutIntensity("medium");
    setWorkoutNotes("");
  }

  async function toggleBucketItem(id: string) {
    const res = await fetch("/api/bucketlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "toggle" }),
    });

    if (res.ok) {
      const data = await res.json();
      setBucketList(data.items || bucketList);
    }
  }

  async function addBucketItem() {
    if (!newBucketText.trim()) return;
    const res = await fetch("/api/bucketlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", text: newBucketText.trim() }),
    });

    if (res.ok) {
      const data = await res.json();
      setBucketList(data.items || bucketList);
      setNewBucketText("");
    }
  }

  async function downloadBackup() {
    try {
      const res = await fetch("/api/backup");
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `life-tracker-backup-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("Backup failed", e);
    }
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const completedCount = Object.values(habits).filter(Boolean).length;
  const completedPercentage = Math.round((completedCount / HABITS.length) * 100);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-purple-600/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-br from-blue-600/20 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-gradient-to-br from-pink-600/10 via-transparent to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 max-w-7xl mx-auto p-6 md:p-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="relative">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                  Mission Control
                </h1>
                <div className="absolute -top-1 -right-6 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                <div className="absolute -top-1 -right-6 w-2 h-2 bg-green-500 rounded-full" />
              </div>
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-white/60 backdrop-blur-sm">
                Patrick Rieder
              </span>
            </div>
            <p className="text-white/50 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-2 p-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
            {[
              { key: "overview", label: "Overview", icon: Activity },
              { key: "tracker", label: "Tracker", icon: Dumbbell },
              { key: "projects", label: "Projects", icon: Rocket },
              { key: "finances", label: "Finances", icon: DollarSign },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
                  activeTab === tab.key
                    ? "bg-white/10 text-white shadow-lg shadow-white/5"
                    : "text-white/50 hover:text-white/80"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Quick Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {KPIs.map((kpi, i) => (
                <div
                  key={i}
                  className="relative group p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all hover:translate-y-[-2px]"
                >
                  <div className={cn(`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-10 rounded-2xl blur-xl group-hover:opacity-20 transition-opacity`)} />
                  <div className="relative">
                    <div className={cn(`inline-flex p-2 bg-gradient-to-br ${kpi.color} rounded-xl mb-4`)}>
                      <kpi.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-3xl font-bold mb-1">{kpi.value}</p>
                    <p className="text-sm text-white/50">{kpi.label}</p>
                    <p className="text-xs text-white/30 mt-1">Target: {kpi.target}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Weather Widget */}
            {weather && (
              <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-xl rounded-3xl border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-xl">
                      <Droplets className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Wetter Annweiler</h3>
                      <p className="text-xs text-white/40">3-Tage-Vorschau</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Current */}
                  <div className="p-4 bg-white/5 rounded-2xl text-center md:col-span-1">
                    <p className="text-xs text-white/40 mb-1">Jetzt</p>
                    <div className="text-4xl mb-2">
                      {weather.icon === "CloudRain" && <CloudRain className="w-8 h-8 text-cyan-400 mx-auto" />}
                      {weather.icon === "CloudSnow" && <CloudSnow className="w-8 h-8 text-blue-300 mx-auto" />}
                      {weather.icon === "Sun" && <Sun className="w-8 h-8 text-amber-400 mx-auto" />}
                      {weather.icon === "Cloud" && <Cloud className="w-8 h-8 text-white/60 mx-auto" />}
                      {weather.icon === "CloudLightning" && <CloudLightning className="w-8 h-8 text-yellow-400 mx-auto" />}
                      {weather.icon === "Wind" && <Wind className="w-8 h-8 text-white/60 mx-auto" />}
                    </div>
                    <p className="text-3xl font-bold">{weather.temp}°C</p>
                    <p className="text-xs text-white/50">gefühlt {weather.feels}°C</p>
                    <p className="text-xs text-white/40 mt-1">{weather.condition}</p>
                  </div>
                  {/* Forecast days */}
                  {forecast.map((day, i) => {
                    const date = new Date(day.date);
                    const dayName = date.toLocaleDateString('de-DE', { weekday: 'short' });
                    return (
                      <div key={i} className="p-4 bg-white/5 rounded-2xl text-center">
                        <p className="text-xs text-white/40 mb-2">{dayName}</p>
                        <div className="mb-2">
                          {day.icon === "CloudRain" && <CloudRain className="w-6 h-6 text-cyan-400 mx-auto" />}
                          {day.icon === "CloudSnow" && <CloudSnow className="w-6 h-6 text-blue-300 mx-auto" />}
                          {day.icon === "Sun" && <Sun className="w-6 h-6 text-amber-400 mx-auto" />}
                          {day.icon === "Cloud" && <Cloud className="w-6 h-6 text-white/60 mx-auto" />}
                        </div>
                        <p className="text-lg font-bold">{day.max}° / {day.min}°</p>
                        <p className="text-xs text-white/40 mt-1">{day.condition}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* High Priority Project */}
              <div className="lg:col-span-2 p-6 bg-gradient-to-br from-purple-500/10 via-white/5 to-blue-500/10 backdrop-blur-xl rounded-3xl border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-xl">
                      <Zap className="w-5 h-5 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold">Top Priority</h2>
                  </div>
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                    HIGH
                  </span>
                </div>

                <div className="space-y-4">
                  {PROJECTS.filter(p => p.priority === "high").map(project => (
                    <div key={project.id} className="p-5 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold flex items-center gap-2">
                            {project.name}
                            {project.link && (
                              <a
                                href={project.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 bg-white/10 rounded hover:bg-white/20 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-white/60" />
                              </a>
                            )}
                          </h3>
                          <p className="text-sm text-white/50">{project.description}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/50">Progress</span>
                          <span className="text-white/70">{project.progress}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-sm">
                        <span className="text-white/40">Next:</span>{" "}
                        <span className="text-white/80">{project.nextAction}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="p-6 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-white/60" />
                  Quick Links
                </h2>
                <div className="space-y-3">
                  <a
                    href="https://benefitsi-dashboard.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Gift className="w-5 h-5 text-pink-400" />
                      <span>Benefitsi Dashboard</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
                  </a>

                  <a
                    href="https://benefitsi-dashboard.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 rounded-xl border border-pink-500/20 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-pink-400" />
                      <span className="font-medium">Benefitsi Partner Portal</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-pink-400/60" />
                  </a>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Briefcase className="w-5 h-5 text-amber-400" />
                      <span className="font-medium">Funding Status</span>
                    </div>
                    <p className="text-sm text-white/50">
                      €12.000/mo Grant<br />
                      <span className="text-amber-400">Antwort: {FINANCES.funding.expected}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tracker Tab */}
        {activeTab === "tracker" && (
          <div className="space-y-8">
            {/* Daily Habits */}
            <div className="p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold">Daily Habits</h2>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-400">{completedPercentage}%</p>
                  <p className="text-xs text-white/50">{completedCount}/{HABITS.length} done</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${completedPercentage}%` }}
                />
              </div>

              {/* Habits Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {HABITS.map(habit => {
                  const streak = habitStreaks[habit.id];
                  return (
                    <button
                      key={habit.id}
                      onClick={() => toggleHabit(habit.id)}
                      className={cn(
                        "p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98]",
                        habits[habit.id]
                          ? "bg-green-500/20 border-green-500/30"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      )}
                    >
                      <div className="text-3xl mb-1">{habit.emoji}</div>
                      <div className="text-sm font-medium">{habit.label}</div>
                      <div className="mt-2 flex items-center justify-center gap-1">
                        {habits[habit.id] ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-white/30" />
                        )}
                        {streak && streak.current > 0 && (
                          <span className="text-xs text-orange-400 font-medium ml-1">
                            🔥{streak.current}
                          </span>
                        )}
                      </div>
                      {streak && streak.last7 && (
                        <div className="mt-2 flex justify-center gap-0.5">
                          {streak.last7.map((done, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                done ? "bg-green-400" : "bg-white/20"
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gym Tracker */}
            <div className="p-8 bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-xl rounded-3xl border border-orange-500/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-xl">
                    <Flame className="w-5 h-5 text-orange-400" />
                  </div>
                  <h2 className="text-xl font-bold">Gym Tracker</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-4xl font-bold text-orange-400">{gymStreak}</p>
                    <p className="text-xs text-white/50">day streak</p>
                  </div>
                  <div className="w-16 h-16 relative">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="32" cy="32" r="28"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        className="text-white/10"
                      />
                      <circle
                        cx="32" cy="32" r="28"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - Math.min(gymStreak / 30, 1))}`}
                        className="text-orange-500 transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Log Gym Button */}
              <button
                onClick={logGym}
                disabled={gymLogs.includes(todayStr)}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-lg transition-all",
                  gymLogs.includes(todayStr)
                    ? "bg-green-500/20 text-green-400 cursor-default"
                    : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 active:scale-[0.98]"
                )}
              >
                {gymLogs.includes(todayStr) ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Trainiert heute ✓
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Dumbbell className="w-5 h-5" /> Gym Session loggen
                  </span>
                )}
              </button>

              {/* Recent Sessions */}
              <div className="mt-6">
                <p className="text-sm text-white/50 mb-3">Letzte Sessions</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {gymLogs.slice(-7).reverse().map((log, i) => {
                    const workout = workoutHistory[log];
                    const isExpanded = expandedWorkout === log;
                    return (
                      <div key={i} className="flex flex-col gap-1">
                        <button
                          onClick={() => workout && setExpandedWorkout(isExpanded ? null : log)}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs whitespace-nowrap transition-all",
                            log === todayStr
                              ? "bg-orange-500/30 text-orange-300"
                              : "bg-white/5 text-white/50 hover:bg-white/10",
                            workout && "cursor-pointer"
                          )}
                          disabled={!workout}
                          title={workout ? "Klick für Details" : "Keine Details"}
                        >
                          {new Date(log).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' })}
                          {workout && <span className="ml-1 opacity-60">›</span>}
                        </button>
                        {isExpanded && workout && (
                          <div className="bg-white/10 border border-white/20 rounded-xl p-3 text-xs whitespace-normal w-48">
                            <div className="font-medium text-white/80 capitalize mb-1">{workout.type}</div>
                            <div className="text-white/50">{workout.duration} min · {workout.intensity}</div>
                            {workout.notes && <div className="text-white/40 mt-1 italic">"{workout.notes}"</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {gymLogs.length === 0 && (
                    <p className="text-sm text-white/30">Noch keine Sessions geloggt</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bucket List */}
            <div className="p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-xl">
                    <Star className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold">Bucket List</h2>
                </div>
                <button
                  onClick={downloadBackup}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/60 transition-all"
                  title="Backup all data"
                >
                  <Download className="w-4 h-4" />
                  Backup
                </button>
              </div>

              {/* Add New Item */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newBucketText}
                  onChange={(e) => setNewBucketText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addBucketItem()}
                  placeholder="Neues Ziel hinzufügen..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={addBucketItem}
                  className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-400 font-medium transition-all"
                >
                  + Add
                </button>
              </div>

              <div className="space-y-4">
                {bucketList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleBucketItem(item.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:bg-white/10",
                      item.completed
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-white/5 border-white/10"
                    )}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1">
                      <p className={cn("font-medium", item.completed && "line-through text-white/40")}>{item.text}</p>
                      <p className="text-xs text-white/40">{item.target}</p>
                    </div>
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-white/30" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">All Projects</h2>
              <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/60">
                {PROJECTS.length} Projects
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {PROJECTS.map(project => (
                <div
                  key={project.id}
                  className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                        {project.name}
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 bg-white/10 rounded hover:bg-white/20 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-white/60" />
                          </a>
                        )}
                      </h3>
                      <p className="text-sm text-white/50">{project.description}</p>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      project.priority === "high" ? "bg-red-500/20 text-red-400" :
                      project.priority === "medium" ? "bg-amber-500/20 text-amber-400" :
                      "bg-slate-500/20 text-slate-400"
                    )}>
                      {project.priority.toUpperCase()}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/50">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      project.status === "active" ? "bg-green-500/20 text-green-400" :
                      project.status === "planning" ? "bg-blue-500/20 text-blue-400" :
                      "bg-slate-500/20 text-slate-400"
                    )}>
                      {project.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-white/40">
                      Next: {project.nextAction}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Finances Tab */}
        {activeTab === "finances" && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold">Financial Overview</h2>

            {/* Main Numbers */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-8 bg-gradient-to-br from-green-500/20 to-emerald-500/10 backdrop-blur-xl rounded-3xl border border-green-500/20">
                <p className="text-sm text-white/50 mb-2">Savings</p>
                <p className="text-5xl font-bold text-green-400">
                  €{FINANCES.savings.toLocaleString()}
                </p>
              </div>

              <div className="p-8 bg-gradient-to-br from-amber-500/20 to-orange-500/10 backdrop-blur-xl rounded-3xl border border-amber-500/20">
                <p className="text-sm text-white/50 mb-2">Crypto / Bitcoin</p>
                <p className="text-5xl font-bold text-amber-400">
                  €{FINANCES.crypto.toLocaleString()}
                </p>
              </div>

              <div className="p-8 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 backdrop-blur-xl rounded-3xl border border-blue-500/20">
                <p className="text-sm text-white/50 mb-2">Monthly Costs</p>
                <p className="text-5xl font-bold text-blue-400">
                  €{FINANCES.monthlyCosts.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Funding Status */}
            <div className="p-8 bg-gradient-to-br from-purple-500/20 to-pink-500/10 backdrop-blur-xl rounded-3xl border border-purple-500/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-purple-500/30 rounded-2xl">
                  <Zap className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Pending Funding</h3>
                  <p className="text-white/50">Grant Application</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-white/50 mb-1">Potential Monthly Grant</p>
                  <p className="text-4xl font-bold text-green-400">
                    €{FINANCES.funding.amount.toLocaleString()}/mo
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/50 mb-1">Expected Response</p>
                  <p className="text-3xl font-bold text-purple-300">
                    {FINANCES.funding.expected}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Net Worth */}
            <div className="p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50 mb-2">Total Net Worth</p>
                  <p className="text-6xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    €{(FINANCES.savings + FINANCES.crypto).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/50">Runway</p>
                  <p className="text-3xl font-bold text-white">
                    ~{Math.round((FINANCES.savings + FINANCES.crypto) / FINANCES.monthlyCosts)} months
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workout Modal */}
        {showWorkoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 bg-[#111] rounded-3xl border border-white/20 shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-xl">
                  <Dumbbell className="w-5 h-5 text-orange-400" />
                </div>
                Workout Details
              </h3>

              {/* Workout Type */}
              <div className="mb-5">
                <label className="block text-sm text-white/50 mb-2">Workout Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {["strength", "cardio", "mixed"].map(type => (
                    <button
                      key={type}
                      onClick={() => setWorkoutType(type)}
                      className={cn(
                        "p-3 rounded-xl text-sm font-medium capitalize transition-all",
                        workoutType === type
                          ? "bg-orange-500/30 border border-orange-500/50 text-orange-300"
                          : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="mb-5">
                <label className="block text-sm text-white/50 mb-2">Duration: {workoutDuration} min</label>
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="5"
                  value={workoutDuration}
                  onChange={e => setWorkoutDuration(Number(e.target.value))}
                  className="w-full accent-orange-500"
                />
              </div>

              {/* Intensity */}
              <div className="mb-5">
                <label className="block text-sm text-white/50 mb-2">Intensity</label>
                <div className="grid grid-cols-3 gap-2">
                  {["light", "medium", "intense"].map(intensity => (
                    <button
                      key={intensity}
                      onClick={() => setWorkoutIntensity(intensity)}
                      className={cn(
                        "p-3 rounded-xl text-sm font-medium capitalize transition-all",
                        workoutIntensity === intensity
                          ? intensity === "light" ? "bg-green-500/30 border border-green-500/50 text-green-300" :
                            intensity === "medium" ? "bg-amber-500/30 border border-amber-500/50 text-amber-300" :
                            "bg-red-500/30 border border-red-500/50 text-red-300"
                          : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                      )}
                    >
                      {intensity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm text-white/50 mb-2">Notes (optional)</label>
                <textarea
                  value={workoutNotes}
                  onChange={e => setWorkoutNotes(e.target.value)}
                  placeholder="e.g. PR on deadlift, felt great..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWorkoutModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmGymLog}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl font-bold text-white transition-all"
                >
                  Log Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-white/10 text-center text-white/30 text-sm">
          <p>Mission Control • Patrick Rieder • {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}