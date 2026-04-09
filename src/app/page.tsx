"use client";

import { useState, useEffect } from "react";
import {
  Rocket, DollarSign, TrendingUp, Target, Zap, Globe,
  Briefcase, Wallet, ChevronRight, ExternalLink,
  Activity, Calendar, Award, Gift, CheckCircle2, Circle,
  Dumbbell, Flame, Star, TrendingDown, Cloud, CloudRain,
  CloudSnow, Sun, CloudLightning, Wind, Droplets, Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Download } from "lucide-react";

// === Financial Data (loaded from API) ===
// FINANCES is now loaded dynamically from /api/finance
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
    status: "active",
    priority: "medium",
    link: null,
    progress: 50,
    nextAction: "Game Direction wählen (Speed Run vs andere)"
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

// === KPIs (computed dynamically from API data) ===
// Computed inline when rendering overview — see activeTab === "overview" section
// Net Worth = savings + crypto | Sparquote = savings / (savings + monthlyCosts) | Daily Progress from habits

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
  const [habitHistory, setHabitHistory] = useState<{ weeks: Array<Array<{ date: string; completion: number; completed: number; total: number }>>; stats: { totalDays: number; perfectDays: number; avgCompletion: number; longestPerfect: number } }>({ weeks: [], stats: { totalDays: 0, perfectDays: 0, avgCompletion: 0, longestPerfect: 0 } });
  const [newBucketText, setNewBucketText] = useState("");
  const [bucketCategory, setBucketCategory] = useState<string>("all");
  const [newBucketCategory, setNewBucketCategory] = useState<string>("other");
  const [loading, setLoading] = useState(true);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutType, setWorkoutType] = useState("strength");
  const [workoutDuration, setWorkoutDuration] = useState(60);
  const [workoutIntensity, setWorkoutIntensity] = useState("medium");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [workoutHistory, setWorkoutHistory] = useState<Record<string, ({ type: string; duration: number; intensity: string; notes?: string } | { muscles: string[]; exercises: string[]; notes?: string; timestamp?: string })>>({});
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

  // Weight tracking
  const [weightEntries, setWeightEntries] = useState<any[]>([]);
  const [weightGoal, setWeightGoal] = useState(75.0);
  const [weightTrend, setWeightTrend] = useState(0);
  const [weightBMI, setWeightBMI] = useState<number | null>(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightValue, setWeightValue] = useState("");
  const [weightNotes, setWeightNotes] = useState("");

  // Water tracking
  const [waterData, setWaterData] = useState<{
    dailyGoal: number;
    todayGlasses: number;
    todayProgress: number;
    weeklyAvg: number;
    streak: number;
    recentEntries: any[];
  }>({ dailyGoal: 8, todayGlasses: 0, todayProgress: 0, weeklyAvg: 0, streak: 0, recentEntries: [] });

  // Nutrition tracking
  const [nutritionData, setNutritionData] = useState<{
    dailyGoals: { protein: number; carbs: number; calories: number; fat?: number };
    todayMeals: any[];
    dailyNutrition: { protein: number; carbs: number; fat: number; calories: number };
    weeklyAvg: { calories: number; protein: number };
  }>({ dailyGoals: { protein: 150, carbs: 250, calories: 2200, fat: 80 }, todayMeals: [], dailyNutrition: { protein: 0, carbs: 0, fat: 0, calories: 0 }, weeklyAvg: { calories: 0, protein: 0 } });
  const [newMeal, setNewMeal] = useState({ name: "", calories: "", protein: "", carbs: "" });

  // Sleep tracking
  const [sleepEntries, setSleepEntries] = useState<any[]>([]);
  const [sleepStats, setSleepStats] = useState({ avgDuration: 0, avgQuality: 0, streak: 0 });
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [sleepNotes, setSleepNotes] = useState("");

  // Financial data
  const [finances, setFinances] = useState({
    savings: 2000,
    crypto: 10000,
    monthlyCosts: 1000,
    funding: { status: "pending", amount: 12000, expected: "May/June 2026" },
    transactions: [],
    savingsGoals: []
  });

  // Mentor Tips
  const [mentorData, setMentorData] = useState<{
    today: any;
    pastTips: any[];
  }>({ today: null, pastTips: [] });

  // Mood/Energy tracking
  const [moodData, setMoodData] = useState<{
    energy: number;
    mood: number;
    note: string;
  }>({ energy: 5, mood: 5, note: "" });
  const [moodStats, setMoodStats] = useState({ avgEnergy: 0, avgMood: 0, energyStreak: 0, moodStreak: 0 });
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [moodEnergy, setMoodEnergy] = useState(5);
  const [moodValue, setMoodValue] = useState(5);
  const [moodNote, setMoodNote] = useState("");

  // Wellness tracking (meditation + screen time)
  const [wellnessData, setWellnessData] = useState<{
    meditation: {
      entries: any[];
      today: any;
      stats: { avgMinutes: number; avgSessions: number; streak: number; totalMinutes: number; totalSessions: number };
      goals: { minutes: number; sessions: number };
    };
    screenTime: {
      todayMinutes: number;
      dailyLimit: number;
      todayProgress: number;
      stats: { avgDaily: number; streak: number; overLimitDays: number };
    };
  }>({
    meditation: { entries: [], today: null, stats: { avgMinutes: 0, avgSessions: 0, streak: 0, totalMinutes: 0, totalSessions: 0 }, goals: { minutes: 15, sessions: 1 } },
    screenTime: { todayMinutes: 0, dailyLimit: 120, todayProgress: 0, stats: { avgDaily: 0, streak: 0, overLimitDays: 0 } }
  });
  const [showWellnessModal, setShowWellnessModal] = useState(false);
  const [wellnessMinutes, setWellnessMinutes] = useState(15);
  const [wellnessType, setWellnessType] = useState("mindfulness");
  const [wellnessNote, setWellnessNote] = useState("");

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

  // Fetch week summary
  useEffect(() => {
    async function loadWeekSummary() {
      try {
        const res = await fetch("/api/week-summary");
        if (!res.ok) return;
        const data = await res.json();
        const container = document.getElementById("week-summary-container");
        const loading = document.getElementById("week-summary-loading");
        if (!container) return;
        if (loading) loading.style.display = "none";

        const emojiMap: Record<string, string> = {
          habits: "📋", gym: "💪", water: "💧", sleep: "🌙", mood: "💭"
        };
        const colorMap: Record<string, string> = {
          gym: "text-orange-400",
          water: "text-cyan-400",
          sleep: "text-indigo-400",
          mood: "text-pink-400",
        };

        container.innerHTML = data.days.map((day: any) => {
          const items = [];
          if (day.habits.pct > 0) items.push(`📋 ${day.habits.done}/${day.habits.total}`);
          if (day.gym) items.push("💪");
          if (day.water > 0) items.push(`💧 ${day.water}`);
          if (day.sleep) items.push(`🌙 ${day.sleep.hours}h`);
          if (day.mood) items.push(`⚡${day.mood.energy}`);
          if (day.nutrition.calories > 0) items.push(`🍽️${day.nutrition.calories}`);
          if (day.weight) items.push(`⚖️${day.weight}kg`);

          const completeness = Math.round((day.habits.pct / 100) * 5);
          const bar = "●".repeat(completeness) + "○".repeat(5 - completeness);

          return `
            <div class="flex items-center gap-3 p-2 rounded-xl bg-white/5">
              <span class="text-xs text-white/40 w-8">${day.dayName}</span>
              <span class="${day.habits.pct >= 75 ? "text-green-400" : day.habits.pct >= 50 ? "text-yellow-400" : "text-white/30"} text-xs font-mono w-10">${bar}</span>
              <span class="text-xs text-white/60 flex-1">${items.length > 0 ? items.join(" ") : "—"}</span>
              ${day.gym ? '<span class="text-xs">🔥' + (data.streaks?.gym || 0) + '</span>' : ''}
            </div>
          `;
        }).join("");

        // Streak badges
        if (data.streaks?.gym > 0) {
          container.innerHTML += `<div class="mt-2 flex gap-2"><span class="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">💪 ${data.streaks.gym}-day gym streak</span></div>`;
        }

        // === Populate 7-Day Sparkline ===
        const sparklineEl = document.getElementById("habit-sparkline");
        const weekGymCount = document.getElementById("week-gym-count");
        const weekSleepAvg = document.getElementById("week-sleep-avg");
        const weekAvgLabel = document.getElementById("week-avg-label");

        if (sparklineEl && data.days) {
          const pcts = data.days.map((d: any) => d.habits.pct || 0);
          const maxPct = Math.max(...pcts, 1);
          const gymCount = data.days.filter((d: any) => d.gym).length;
          const sleepEntries = data.days.filter((d: any) => d.sleep).map((d: any) => d.sleep.hours);
          const sleepAvg = sleepEntries.length > 0
            ? (sleepEntries.reduce((a: number, b: number) => a + b, 0) / sleepEntries.length).toFixed(1)
            : null;
          const avgPct = Math.round(pcts.reduce((a: number, b: number) => a + b, 0) / pcts.length);

          sparklineEl.innerHTML = pcts.map((pct: number, i: number) => {
            const height = Math.max(4, Math.round((pct / maxPct) * 40));
            const color = pct >= 75 ? "bg-green-400" : pct >= 50 ? "bg-yellow-400" : "bg-white/20";
            return `<div class="flex-1 ${color} rounded-sm transition-all" style="height:${height}px" title="${pct}%" />`;
          }).join("");

          if (weekGymCount) weekGymCount.textContent = String(gymCount);
          if (weekSleepAvg) weekSleepAvg.textContent = sleepAvg ? `${sleepAvg}h` : "—";
          if (weekAvgLabel) weekAvgLabel.textContent = `Ø ${avgPct}%`;

          // Day labels
          data.days.forEach((d: any, i: number) => {
            const labelEl = document.getElementById(`sparkline-day-${i}`);
            if (labelEl) labelEl.textContent = d.dayName;
          });
        }
      } catch(e) {
        const loading = document.getElementById("week-summary-loading");
        if (loading) loading.textContent = "Fehler";
      }
    }
    loadWeekSummary();
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

      // Fetch habit history (heatmap)
      try {
        const historyRes = await fetch("/api/habit-history?days=90");
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHabitHistory({ weeks: historyData.weeks || [], stats: historyData.stats || {} });
        }
      } catch (e) {
        console.error("Failed to load habit history", e);
      }

      // Fetch finances
      try {
        const financeRes = await fetch("/api/finance");
        if (financeRes.ok) {
          const financeData = await financeRes.json();
          setFinances(financeData);
        }
      } catch (e) {
        console.error("Failed to load finances", e);
      }

      // Fetch weight
      try {
        const weightRes = await fetch("/api/weight");
        if (weightRes.ok) {
          const weightData = await weightRes.json();
          setWeightEntries(weightData.entries || []);
          setWeightGoal(weightData.goal || 75.0);
          setWeightTrend(weightData.trend || 0);
          setWeightBMI(weightData.bmi || null);
        }
      } catch (e) {
        console.error("Failed to load weight", e);
      }

      // Fetch water
      try {
        const waterRes = await fetch("/api/water");
        if (waterRes.ok) {
          const waterResult = await waterRes.json();
          setWaterData(waterResult);
        }
      } catch (e) {
        console.error("Failed to load water", e);
      }

      // Fetch sleep
      try {
        const sleepRes = await fetch("/api/sleep");
        if (sleepRes.ok) {
          const sleepData = await sleepRes.json();
          setSleepEntries(sleepData.entries || []);
          setSleepStats(sleepData.stats || { avgDuration: 0, avgQuality: 0, streak: 0 });
        }
      } catch (e) {
        console.error("Failed to load sleep", e);
      }
      // Fetch nutrition
      try {
        const nutritionRes = await fetch("/api/meals");
        if (nutritionRes.ok) {
          const nutritionResult = await nutritionRes.json();
          setNutritionData(nutritionResult);
        }
      } catch (e) {
        console.error("Failed to load nutrition", e);
      }

      // Fetch mood
      try {
        const moodRes = await fetch("/api/mood");
        if (moodRes.ok) {
          const moodResult = await moodRes.json();
          setMoodStats(moodResult.stats || { avgEnergy: 0, avgMood: 0, energyStreak: 0, moodStreak: 0 });
          if (moodResult.today) {
            setMoodData({ energy: moodResult.today.energy, mood: moodResult.today.mood, note: moodResult.today.note || "" });
          }
        }
      } catch (e) {
        console.error("Failed to load mood", e);
      }

      // Fetch wellness
      try {
        const wellnessRes = await fetch("/api/wellness");
        if (wellnessRes.ok) {
          const wellnessResult = await wellnessRes.json();
          setWellnessData(wellnessResult);
        }
      } catch (e) {
        console.error("Failed to load wellness", e);
      }

      // Fetch mentor tips
      try {
        const mentorRes = await fetch("/api/mentor");
        if (mentorRes.ok) {
          const mentorResult = await mentorRes.json();
          setMentorData({ today: mentorResult.today, pastTips: mentorResult.pastTips || [] });
        }
      } catch (e) {
        console.error("Failed to load mentor tips", e);
      }
    } catch (e) {
      console.error("Failed to load data", e);
    }
    setLoading(false);
  }

  async function addMeal() {
    if (!newMeal.name || !newMeal.calories) return;
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          meal: { name: newMeal.name, calories: Number(newMeal.calories), protein: Number(newMeal.protein) || 0, carbs: Number(newMeal.carbs) || 0 }
        })
      });
      if (res.ok) {
        setNewMeal({ name: "", calories: "", protein: "", carbs: "" });
        const refreshed = await fetch("/api/meals");
        if (refreshed.ok) setNutritionData(await refreshed.json());
      }
    } catch (e) { console.error("Failed to add meal", e); }
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
      body: JSON.stringify({ action: "add", text: newBucketText.trim(), category: newBucketCategory }),
    });

    if (res.ok) {
      const data = await res.json();
      setBucketList(data.items || bucketList);
      setNewBucketText("");
      setNewBucketCategory("other");
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

  async function logWeight() {
    setShowWeightModal(true);
  }

  async function confirmWeightLog() {
    const weight = parseFloat(weightValue);
    if (isNaN(weight) || weight < 30 || weight > 200) return;

    const res = await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "log", weight, notes: weightNotes }),
    });

    if (res.ok) {
      const data = await res.json();
      setWeightEntries(data.entries || []);
      setWeightTrend(data.trend || 0);
    }
    setShowWeightModal(false);
    setWeightValue("");
    setWeightNotes("");
  }

  async function logSleep() {
    setShowSleepModal(true);
  }

  async function confirmSleepLog() {
    const today = new Date().toISOString().split("T")[0];
    
    const res = await fetch("/api/sleep", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "log",
        date: today,
        duration: sleepHours,
        quality: sleepQuality,
        notes: sleepNotes
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setSleepEntries(data.entries || []);
      if (data.stats) {
        setSleepStats(data.stats);
      }
    }
    setShowSleepModal(false);
    setSleepHours(7);
    setSleepQuality(5);
    setSleepNotes("");
  }

  async function addWater(delta: number) {
    const action = delta > 0 ? "add" : "remove";
    try {
      const res = await fetch("/api/water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setWaterData(prev => ({
          ...prev,
          todayGlasses: data.glasses,
          todayProgress: Math.round((data.glasses / data.dailyGoal) * 100)
        }));
      }
    } catch (e) {
      console.error("Failed to update water", e);
    }
  }

  async function logMood() {
    setShowMoodModal(true);
  }

  async function confirmMoodLog() {
    const today = new Date().toISOString().split("T")[0];
    
    const res = await fetch("/api/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "log",
        date: today,
        energy: moodEnergy,
        mood: moodValue,
        note: moodNote
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.stats) {
        setMoodStats(data.stats);
      }
      if (data.entry) {
        setMoodData({ energy: data.entry.energy, mood: data.entry.mood, note: data.entry.note || "" });
      }
    }
    setShowMoodModal(false);
    setMoodEnergy(5);
    setMoodValue(5);
    setMoodNote("");
  }

  async function logWellness() {
    setShowWellnessModal(true);
  }

  async function confirmWellnessLog() {
    const res = await fetch("/api/wellness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "logMeditation",
        minutes: wellnessMinutes,
        type: wellnessType,
        note: wellnessNote
      }),
    });

    if (res.ok) {
      const refreshed = await fetch("/api/wellness");
      if (refreshed.ok) setWellnessData(await refreshed.json());
    }
    setShowWellnessModal(false);
    setWellnessMinutes(15);
    setWellnessType("mindfulness");
    setWellnessNote("");
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
              {[
                {
                  label: "Sparquote",
                  value: `${Math.min(Math.round((finances.savings / (finances.savings + finances.monthlyCosts)) * 100), 100)}%`,
                  target: "80%",
                  icon: TrendingUp,
                  color: "from-green-500 to-emerald-500",
                },
                {
                  label: "Daily Progress",
                  value: `${completedPercentage}%`,
                  target: "100%",
                  icon: Activity,
                  color: "from-blue-500 to-cyan-500",
                },
                {
                  label: "Funding Chance",
                  value: "TBD",
                  target: finances.funding.expected,
                  icon: Target,
                  color: "from-purple-500 to-pink-500",
                },
                {
                  label: "Net Worth",
                  value: finances.savings + finances.crypto >= 1000
                    ? `€${((finances.savings + finances.crypto) / 1000).toFixed(0)}K`
                    : `€${finances.savings + finances.crypto}`,
                  target: "€50K",
                  icon: Wallet,
                  color: "from-amber-500 to-orange-500",
                },
              ].map((kpi, i) => (
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

            {/* Today's Snapshot — All Tracker Metrics at a Glance */}
            <div className="p-6 bg-gradient-to-br from-white/5 via-white/3 to-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-xl">
                    <Activity className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Today's Snapshot</h3>
                    <p className="text-xs text-white/40">All metrics in one view</p>
                  </div>
                </div>
                <span className="text-xs text-white/30">
                  {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {/* Habits */}
                <div className="p-3 bg-white/5 rounded-xl text-center">
                  <div className="text-2xl mb-1">📋</div>
                  <p className="text-sm font-bold text-white/80">{completedCount}/{HABITS.length}</p>
                  <p className="text-xs text-white/40">Habits</p>
                  <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${completedPercentage}%` }} />
                  </div>
                </div>

                {/* Water */}
                <div className="p-3 bg-white/5 rounded-xl text-center">
                  <div className="text-2xl mb-1">💧</div>
                  <p className="text-sm font-bold text-cyan-400">{waterData.todayGlasses}/{waterData.dailyGoal}</p>
                  <p className="text-xs text-white/40">Water</p>
                  <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${Math.min(waterData.todayProgress, 100)}%` }} />
                  </div>
                </div>

                {/* Sleep */}
                <div className="p-3 bg-white/5 rounded-xl text-center">
                  <div className="text-2xl mb-1">🌙</div>
                  <p className="text-sm font-bold text-indigo-400">
                    {sleepEntries[0] ? `${sleepEntries[0].duration}h` : '—'}
                  </p>
                  <p className="text-xs text-white/40">Sleep</p>
                  {sleepEntries[0] && (
                    <div className="mt-1 flex justify-center gap-0.5">
                      {[1,2,3,4,5,6,7,8,9,10].slice(0, Math.round(sleepEntries[0].quality || 0)).map(q => (
                        <div key={q} className="w-1 h-1 rounded-full bg-indigo-400" />
                      ))}
                    </div>
                  )}
                </div>

                {/* Gym */}
                <div className="p-3 bg-white/5 rounded-xl text-center">
                  <div className="text-2xl mb-1">💪</div>
                  <p className="text-sm font-bold text-orange-400">{gymStreak}🔥</p>
                  <p className="text-xs text-white/40">Gym Streak</p>
                  {gymLogs.includes(todayStr) ? (
                    <span className="mt-1 inline-block text-xs text-green-400">✓ Heute</span>
                  ) : (
                    <span className="mt-1 inline-block text-xs text-white/30">Offen</span>
                  )}
                </div>

                {/* Energy */}
                <div className="p-3 bg-white/5 rounded-xl text-center">
                  <div className="text-2xl mb-1">⚡</div>
                  <p className="text-sm font-bold text-rose-400">{moodData.energy}/10</p>
                  <p className="text-xs text-white/40">Energy</p>
                  <div className="mt-1.5 flex justify-center gap-0.5">
                    {[1,2,3,4,5,6,7,8,9,10].slice(0, moodData.energy).map(e => (
                      <div key={e} className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    ))}
                  </div>
                </div>

                {/* Mood */}
                <div className="p-3 bg-white/5 rounded-xl text-center">
                  <div className="text-2xl mb-1">💭</div>
                  <p className="text-sm font-bold text-pink-400">{moodData.mood}/10</p>
                  <p className="text-xs text-white/40">Mood</p>
                  <div className="mt-1.5 flex justify-center gap-0.5">
                    {[1,2,3,4,5,6,7,8,9,10].slice(0, moodData.mood).map(m => (
                      <div key={m} className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                    ))}
                  </div>
                </div>

                {/* Nutrition */}
                <div className="p-3 bg-white/5 rounded-xl text-center">
                  <div className="text-2xl mb-1">🍽️</div>
                  <p className="text-sm font-bold text-orange-400">{nutritionData.dailyNutrition.calories}</p>
                  <p className="text-xs text-white/40">kcal</p>
                  <p className="text-xs text-white/30 mt-0.5">{nutritionData.dailyNutrition.protein}g P</p>
                </div>
              </div>

              {/* Quick-Tap Habits — toggle habits without leaving overview */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-white/40 font-medium">Schnell abhaken</p>
                  <p className="text-xs text-white/30">{completedCount}/{HABITS.length} heute</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {HABITS.map(habit => (
                    <button
                      key={habit.id}
                      onClick={() => toggleHabit(habit.id)}
                      title={habit.label}
                      className={cn(
                        "flex-shrink-0 w-12 h-12 rounded-xl border flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95",
                        habits[habit.id]
                          ? "bg-green-500/25 border-green-500/40"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      )}
                    >
                      <span className="text-xl leading-none">{habit.emoji}</span>
                      <span className={cn(
                        "text-[9px] mt-0.5 leading-tight",
                        habits[habit.id] ? "text-green-400" : "text-white/30"
                      )}>{habit.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Weekly Summary — 7-Day Overview */}
            <div className="p-6 bg-gradient-to-br from-white/5 to-white/3 backdrop-blur-xl rounded-3xl border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold">Wochenüberblick</h3>
                <span className="text-xs text-white/30 ml-auto" id="week-summary-loading">Laden...</span>
              </div>
              <div id="week-summary-container" className="space-y-2">
                {/* Filled by JS fetch */}
              </div>
            </div>

            {/* Weekly Trends — 7-Day Sparkline */}
            <div className="p-6 bg-gradient-to-br from-white/5 to-white/3 backdrop-blur-xl rounded-3xl border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold">7-Tage Trend</h3>
              </div>
              {/* Habit sparkline */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-white/50">Habits</p>
                  <p className="text-xs text-white/30" id="week-avg-label">—</p>
                </div>
                <div id="habit-sparkline" className="flex items-end gap-1 h-10">
                  {/* Filled by JS */}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-white/25" id="sparkline-day-6">—</span>
                  <span className="text-[9px] text-white/25" id="sparkline-day-5">—</span>
                  <span className="text-[9px] text-white/25" id="sparkline-day-4">—</span>
                  <span className="text-[9px] text-white/25" id="sparkline-day-3">—</span>
                  <span className="text-[9px] text-white/25" id="sparkline-day-2">—</span>
                  <span className="text-[9px] text-white/25" id="sparkline-day-1">—</span>
                  <span className="text-[9px] text-white/25" id="sparkline-day-0">—</span>
                </div>
              </div>
              {/* Gym + Sleep row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-xl">
                  <p className="text-xs text-white/40 mb-1">💪 Gym-Sessions</p>
                  <p className="text-lg font-bold text-orange-400" id="week-gym-count">—</p>
                  <p className="text-[10px] text-white/25 mt-0.5">diese Woche</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <p className="text-xs text-white/40 mb-1">🌙 Ø Schlaf</p>
                  <p className="text-lg font-bold text-indigo-400" id="week-sleep-avg">—</p>
                  <p className="text-[10px] text-white/25 mt-0.5">Std/ Nacht</p>
                </div>
              </div>
            </div>

            {/* Daily Mentor Section */}
            {mentorData.today && (
              <div className="p-6 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 backdrop-blur-xl rounded-3xl border border-violet-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/20 rounded-xl">
                      <span className="text-xl">{mentorData.today.emoji}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Daily Mentor</h3>
                      <p className="text-xs text-white/40">Tip #{((mentorData.today.dayOfYear || 0) % 30) + 1} of {30}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full text-xs font-medium capitalize">
                    {mentorData.today.category}
                  </span>
                </div>

                <div className="mb-3">
                  <h4 className="text-xl font-bold text-white mb-2">{mentorData.today.title}</h4>
                  <p className="text-sm text-white/60 leading-relaxed">{mentorData.today.text}</p>
                </div>

                {mentorData.today.action && (
                  <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl mb-3">
                    <p className="text-xs text-violet-400 font-medium mb-1">🎯 Your Action</p>
                    <p className="text-sm text-white/70">{mentorData.today.action}</p>
                  </div>
                )}

                {mentorData.pastTips.length > 0 && (
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-xs text-white/30 mb-2">Previous Tips</p>
                    <div className="flex gap-1 overflow-x-auto pb-1">
                      {mentorData.pastTips.slice(0, 5).map((tip: any) => (
                        <div
                          key={tip.id}
                          title={tip.title}
                          className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm hover:bg-violet-500/20 hover:border-violet-500/30 transition-all cursor-default"
                        >
                          {tip.emoji}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                    href="https://benefitsi-landing.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 rounded-xl border border-pink-500/20 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-pink-400" />
                      <div>
                        <span className="font-medium">Benefitsi Partner Portal</span>
                        <span className="ml-2 text-xs text-green-400">✨ Landing Page neu!</span>
                      </div>
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

              {/* Habit Heatmap — Monthly Calendar */}
              {habitHistory.weeks.length > 0 && (
                <div className="mt-8 p-5 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold flex items-center gap-2">🔥 Habit Heatmap</h3>
                      <p className="text-xs text-white/40 mt-0.5">12 Wochen — Habits % + 💪 Gym-Sessions</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-white/30">0%</span>
                        {[0, 25, 50, 75, 100].map(level => (
                          <div key={level} className="w-3 h-3 rounded-sm" style={{ backgroundColor: level === 0 ? 'rgba(255,255,255,0.08)' : level === 25 ? 'rgba(34,197,94,0.3)' : level === 50 ? 'rgba(34,197,94,0.5)' : level === 75 ? 'rgba(34,197,94,0.75)' : 'rgba(34,197,94,1)' }} />
                        ))}
                        <span className="text-white/30">100%</span>
                        <span className="text-white/20 mx-1">|</span>
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-400 border border-orange-600" title="Gym day" />
                        <span className="text-white/30">Gym</span>
                      </div>
                    </div>
                  </div>

                  {/* Heatmap Grid */}
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {/* Day-of-week labels */}
                    <div className="flex flex-col gap-0.5 mr-1 text-xs text-white/30 justify-around py-0.5">
                      <div className="h-3" /> {/* offset */}
                      <div className="h-3 leading-3">Mon</div>
                      <div className="h-3" />
                      <div className="h-3 leading-3">Wed</div>
                      <div className="h-3" />
                      <div className="h-3 leading-3">Fri</div>
                      <div className="h-3" />
                    </div>

                    {/* Weeks */}
                    {(() => {
                      const gymSet = new Set(gymLogs);
                      return habitHistory.weeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-0.5">
                          {week.map((day, di) => {
                            const bg = day.completion === 100 ? 'rgba(34,197,94,1)' : day.completion >= 75 ? 'rgba(34,197,94,0.75)' : day.completion >= 50 ? 'rgba(34,197,94,0.5)' : day.completion >= 25 ? 'rgba(34,197,94,0.3)' : day.completion > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)';
                            const isToday = day.date === new Date().toISOString().split('T')[0];
                            const dateObj = new Date(day.date);
                            const showLabel = dateObj.getDate() === 1 || wi === 0;
                            const didGym = gymSet.has(day.date);
                            return (
                              <div key={di} className="relative group">
                                <div
                                  className="w-3 h-3 rounded-sm transition-all hover:ring-1 hover:ring-white/40 cursor-default"
                                  style={{ backgroundColor: bg, outline: isToday ? '1.5px solid rgba(255,255,255,0.7)' : 'none' }}
                                  title={`${day.date}: ${day.completed}/${day.total} habits (${day.completion}%)${didGym ? ' | 💪 GYM' : ''}`}
                                />
                                {didGym && (
                                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-400 border border-orange-600 pointer-events-none" title={`💪 Gym on ${day.date}`} />
                                )}
                                {showLabel && (
                                  <div className="absolute bottom-4 left-0 text-xs text-white/40 bg-black/80 px-1 rounded whitespace-nowrap hidden group-hover:block z-10 pointer-events-none">
                                    {dateObj.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Stats Row */}
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    <div className="p-3 bg-white/5 rounded-xl text-center">
                      <p className="text-lg font-bold text-green-400">{habitHistory.stats.avgCompletion}%</p>
                      <p className="text-xs text-white/40">Ø Completion</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl text-center">
                      <p className="text-lg font-bold text-green-400">{habitHistory.stats.perfectDays}</p>
                      <p className="text-xs text-white/40">Perfect Days</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl text-center">
                      <p className="text-lg font-bold text-orange-400">🔥{habitHistory.stats.longestPerfect}</p>
                      <p className="text-xs text-white/40">Longest Perfect</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl text-center">
                      <p className="text-lg font-bold text-white/70">{habitHistory.stats.totalDays}</p>
                      <p className="text-xs text-white/40">Days Tracked</p>
                    </div>
                  </div>
                </div>
              )}
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
                            {'muscles' in workout ? (
                              <>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {(workout as { muscles: string[] }).muscles.map(m => (
                                    <span key={m} className="px-1.5 py-0.5 bg-orange-500/20 text-orange-300 rounded text-xs">{m}</span>
                                  ))}
                                </div>
                                <div className="text-white/60 space-y-0.5">
                                  {(workout as { exercises: string[] }).exercises.slice(0,4).map((ex, ei) => (
                                    <div key={ei} className="truncate">• {ex}</div>
                                  ))}
                                  {(workout as { exercises: string[] }).exercises.length > 4 && (
                                    <div className="text-white/40">+{(workout as { exercises: string[] }).exercises.length - 4} more</div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="font-medium text-white/80 capitalize mb-1">{(workout as { type: string }).type}</div>
                                <div className="text-white/50">{(workout as { duration: number }).duration} min · {(workout as { intensity: string }).intensity}</div>
                              </>
                            )}
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

            {/* Weight Tracker */}
            <div className="p-8 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-3xl border border-blue-500/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-xl">
                    <TrendingDown className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold">Weight Tracker</h2>
                </div>
                <div className="flex items-center gap-4">
                  {weightEntries.length > 0 && (
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-400">
                        {weightEntries[weightEntries.length - 1]?.weight} kg
                      </p>
                      {weightTrend !== 0 && (
                        <p className={cn("text-xs font-medium", weightTrend < 0 ? "text-green-400" : "text-red-400")}>
                          {weightTrend > 0 ? "↑" : "↓"} {Math.abs(weightTrend).toFixed(1)} kg (7 Tage)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-white/5 rounded-2xl text-center">
                  <p className="text-xs text-white/40 mb-1">Ziel</p>
                  <p className="text-xl font-bold text-white/80">{weightGoal} kg</p>
                </div>
                {weightEntries.length > 0 && (
                  <>
                    <div className="p-4 bg-white/5 rounded-2xl text-center">
                      <p className="text-xs text-white/40 mb-1">Letzte Messung</p>
                      <p className="text-xl font-bold text-white/80">
                        {weightEntries[weightEntries.length - 1]?.date?.slice(5)}
                      </p>
                    </div>
                    {weightBMI !== null && (
                      <div className="p-4 bg-white/5 rounded-2xl text-center">
                        <p className="text-xs text-white/40 mb-1">BMI</p>
                        <p className={cn("text-xl font-bold", weightBMI < 25 ? "text-green-400" : "text-amber-400")}>
                          {weightBMI}
                        </p>
                      </div>
                    )}
                    <div className="p-4 bg-white/5 rounded-2xl text-center">
                      <p className="text-xs text-white/40 mb-1">Diff. zum Ziel</p>
                      <p className={cn("text-xl font-bold", 
                        (weightEntries[weightEntries.length - 1]?.weight - weightGoal) <= 0 
                          ? "text-green-400" 
                          : "text-red-400"
                      )}>
                        {weightEntries.length > 0 ? `+${(weightEntries[weightEntries.length - 1]?.weight - weightGoal).toFixed(1)}` : "—"}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Mini Chart */}
              {weightEntries.length >= 2 && (
                <div className="mb-6 p-4 bg-white/5 rounded-2xl">
                  <p className="text-xs text-white/40 mb-3">Letzte 14 Tage</p>
                  <div className="flex items-end gap-1 h-16">
                    {weightEntries.slice(-14).map((entry, i) => {
                      const weights = weightEntries.slice(-14).map(e => e.weight);
                      const minW = Math.min(...weights);
                      const maxW = Math.max(...weights);
                      const range = maxW - minW || 1;
                      const height = ((entry.weight - minW) / range) * 100;
                      return (
                        <div key={i} className="flex-1 group relative">
                          <div
                            className="bg-blue-500/60 hover:bg-blue-400 rounded-t transition-colors"
                            style={{ height: `${Math.max(height, 10)}%` }}
                          />
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-white/40 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {entry.weight}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Log Weight Button */}
              <button
                onClick={logWeight}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-bold text-white transition-all active:scale-[0.98]"
              >
                Gewicht loggen
              </button>

              {/* Recent Entries */}
              {weightEntries.length > 0 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                  {weightEntries.slice(-7).reverse().map((entry, i) => (
                    <div
                      key={i}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs whitespace-nowrap",
                        entry.date === todayStr
                          ? "bg-blue-500/30 text-blue-300"
                          : "bg-white/5 text-white/50"
                      )}
                    >
                      {new Date(entry.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' })}
                      <span className="ml-1 font-bold">{entry.weight}kg</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sleep Tracker */}
            <div className="p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-xl rounded-3xl border border-indigo-500/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-xl">
                    <Moon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-bold">Sleep Tracker</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-4xl font-bold text-indigo-400">{sleepStats.avgDuration.toFixed(1)}h</p>
                    <p className="text-xs text-white/50">Ø 7 Tage</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-400">🔥 {sleepStats.streak}</p>
                    <p className="text-xs text-white/50">Tage ≥7h</p>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-white/5 rounded-2xl text-center">
                  <p className="text-xs text-white/40 mb-1">Ø Qualität</p>
                  <p className="text-xl font-bold text-indigo-400">{sleepStats.avgQuality.toFixed(1)}/10</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl text-center">
                  <p className="text-xs text-white/40 mb-1">Letzte Nacht</p>
                  <p className="text-xl font-bold text-white/80">
                    {sleepEntries[0] ? `${sleepEntries[0].duration}h` : "—"}
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl text-center">
                  <p className="text-xs text-white/40 mb-1">Einträge</p>
                  <p className="text-xl font-bold text-white/80">{sleepEntries.length}</p>
                </div>
              </div>

              {/* Last 7 Days Mini Chart */}
              {sleepEntries.length > 0 && (
                <div className="mb-6 p-4 bg-white/5 rounded-2xl">
                  <p className="text-xs text-white/40 mb-3">Letzte 7 Nächte</p>
                  <div className="flex items-end gap-1 h-16">
                    {sleepEntries.slice(0, 7).reverse().map((entry, i) => {
                      const hours = entry.duration || 0;
                      const height = (hours / 10) * 100;
                      const colorClass = hours >= 7 ? "bg-green-500/60 hover:bg-green-400" : "bg-amber-500/60 hover:bg-amber-400";
                      return (
                        <div key={i} className="flex-1 group relative">
                          <div
                            className={cn("rounded-t transition-colors", colorClass)}
                            style={{ height: `${Math.max(height, 10)}%` }}
                          />
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-white/40 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {hours}h
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Log Sleep Button */}
              <button
                onClick={logSleep}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl font-bold text-white transition-all active:scale-[0.98]"
              >
                Schlaf loggen
              </button>

              {/* Recent Entries */}
              {sleepEntries.length > 0 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                  {sleepEntries.slice(0, 7).map((entry, i) => (
                    <div
                      key={i}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs whitespace-nowrap",
                        entry.date === todayStr
                          ? "bg-indigo-500/30 text-indigo-300"
                          : "bg-white/5 text-white/50"
                      )}
                    >
                      {new Date(entry.date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' })}
                      <span className="ml-1 font-bold">{entry.duration}h</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mood & Energy Tracker */}
        {activeTab === "tracker" && (
        <div className="p-8 bg-gradient-to-br from-rose-500/10 to-pink-500/10 backdrop-blur-xl rounded-3xl border border-rose-500/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 rounded-xl">
                <span className="text-xl">💭</span>
              </div>
              <h2 className="text-xl font-bold">Mood & Energy</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-4xl font-bold text-rose-400">{moodData.energy}/10</p>
                <p className="text-xs text-white/50">Energy</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-pink-400">{moodData.mood}/10</p>
                <p className="text-xs text-white/50">Mood</p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-white/5 rounded-2xl text-center">
              <p className="text-xs text-white/40 mb-1">Ø Energy (7 Tage)</p>
              <p className="text-xl font-bold text-rose-400">{moodStats.avgEnergy.toFixed(1)}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl text-center">
              <p className="text-xs text-white/40 mb-1">Ø Mood (7 Tage)</p>
              <p className="text-xl font-bold text-pink-400">{moodStats.avgMood.toFixed(1)}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl text-center">
              <p className="text-xs text-white/40 mb-1">Energy Streak</p>
              <p className="text-xl font-bold text-rose-400">🔥 {moodStats.energyStreak}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl text-center">
              <p className="text-xs text-white/40 mb-1">Mood Streak</p>
              <p className="text-xl font-bold text-pink-400">🔥 {moodStats.moodStreak}</p>
            </div>
          </div>

          {/* Log Mood Button */}
          <button
            onClick={logMood}
            className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-xl font-bold text-white transition-all active:scale-[0.98]"
          >
            Stimmung & Energy loggen
          </button>
        </div>
        )}

        {/* Wellness Tracker (Meditation + Screen Time) */}
        {activeTab === "tracker" && (
        <div className="p-8 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 backdrop-blur-xl rounded-3xl border border-violet-500/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/20 rounded-xl">
                <span className="text-2xl">🧘</span>
              </div>
              <h2 className="text-xl font-bold">Wellness</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-4xl font-bold text-violet-400">{wellnessData.meditation.stats.streak}</p>
                <p className="text-xs text-white/50">Meditation Streak 🔥</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-400">{wellnessData.screenTime.todayMinutes}/{wellnessData.screenTime.dailyLimit} min</p>
                <p className="text-xs text-white/50">Screen Time heute</p>
              </div>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Meditation */}
            <div className="p-5 bg-white/5 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🧘</span>
                <h3 className="font-bold">Meditation</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-violet-400">{wellnessData.meditation.stats.avgMinutes} min</p>
                  <p className="text-xs text-white/40">Ø 7 Tage</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-violet-400">{wellnessData.meditation.stats.totalMinutes}</p>
                  <p className="text-xs text-white/40">Total Min.</p>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/50">Heute</span>
                  <span className="text-white/70">{wellnessData.meditation.today ? `${wellnessData.meditation.today.minutes} min` : "0 min"}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all" style={{ width: `${Math.min(((wellnessData.meditation.today?.minutes || 0) / (wellnessData.meditation.goals?.minutes || 15)) * 100, 100)}%` }} />
                </div>
              </div>
              <button onClick={logWellness} className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 rounded-xl font-bold text-white text-sm transition-all active:scale-[0.98]">
                + Meditation loggen
              </button>
            </div>

            {/* Screen Time */}
            <div className="p-5 bg-white/5 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">📱</span>
                <h3 className="font-bold">Screen Time</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-400">{wellnessData.screenTime.stats.avgDaily} min</p>
                  <p className="text-xs text-white/40">Ø 7 Tage</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-400">🔥 {wellnessData.screenTime.stats.streak}</p>
                  <p className="text-xs text-white/40">Tage im Limit</p>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/50">Heute</span>
                  <span className="text-white/70">
                    {wellnessData.screenTime.todayProgress > 100
                      ? <span className="text-red-400">+{wellnessData.screenTime.todayMinutes - wellnessData.screenTime.dailyLimit} min über Limit</span>
                      : `${wellnessData.screenTime.todayMinutes} min`
                    }
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", wellnessData.screenTime.todayProgress > 100 ? "bg-red-500" : "bg-gradient-to-r from-indigo-500 to-violet-500")} style={{ width: `${Math.min(wellnessData.screenTime.todayProgress, 100)}%` }} />
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Minuten eintragen"
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50"
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      const val = parseInt((e.target as HTMLInputElement).value);
                      if (!isNaN(val) && val > 0) {
                        await fetch("/api/wellness", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "setScreenMinutes", minutes: val }) });
                        const refreshed = await fetch("/api/wellness");
                        if (refreshed.ok) setWellnessData(await refreshed.json());
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
                <button onClick={() => {
                  const input = document.querySelector('input[placeholder="Minuten eintragen"]') as HTMLInputElement;
                  if (input) input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
                }} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 rounded-xl font-bold text-white text-sm transition-all">
                  Log
                </button>
              </div>
            </div>
          </div>

          {wellnessData.meditation.entries?.length > 0 && (
            <div className="p-4 bg-white/5 rounded-2xl">
              <p className="text-xs text-white/40 mb-3">Meditation (letzte 7 Tage)</p>
              <div className="flex items-end gap-1 h-12">
                {wellnessData.meditation.entries?.slice(-7).reverse().map((entry: any, i: number) => {
                  const minutes = entry.minutes || 0;
                  const goal = wellnessData.meditation.goals?.minutes || 15;
                  const height = (minutes / (goal * 1.5)) * 100;
                  return (
                    <div key={i} className="flex-1 group relative">
                      <div className={cn("rounded-t transition-colors", minutes >= goal ? "bg-violet-500/60 hover:bg-violet-400" : "bg-white/30 hover:bg-white/50")} style={{ height: `${Math.max(height, 10)}%` }} />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-white/40 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{minutes}m</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Water Tracker */}
        {activeTab === "tracker" && (
          <div className="p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-xl rounded-3xl border border-cyan-500/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-xl">
                  <Droplets className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold">Water Tracker</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-4xl font-bold text-cyan-400">{waterData.todayGlasses}/{waterData.dailyGoal}</p>
                  <p className="text-xs text-white/50">Glasses today</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-400">🔥 {waterData.streak}</p>
                  <p className="text-xs text-white/50">Tage streak</p>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-white/5 rounded-2xl text-center">
                <p className="text-xs text-white/40 mb-1">Ø 7 Tage</p>
                <p className="text-xl font-bold text-cyan-400">{waterData.weeklyAvg} Gläser</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl text-center">
                <p className="text-xs text-white/40 mb-1">Today's Progress</p>
                <p className="text-xl font-bold text-white/80">{waterData.todayProgress}%</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl text-center">
                <p className="text-xs text-white/40 mb-1">Goal</p>
                <p className="text-xl font-bold text-white/80">{waterData.dailyGoal} Gläser</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-4 bg-white/10 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(waterData.todayProgress, 100)}%` }}
              />
            </div>

            {/* Add/Remove Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => addWater(-1)}
                disabled={waterData.todayGlasses <= 0}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-medium text-white/70 disabled:opacity-30 transition-all"
              >
                − Remove
              </button>
              <button
                onClick={() => addWater(1)}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl font-bold text-white transition-all active:scale-[0.98]"
              >
                + Add Glass
              </button>
            </div>

            {/* Last 7 Days Mini Chart */}
            {waterData.recentEntries && waterData.recentEntries.length > 0 && (
              <div className="mb-4 p-4 bg-white/5 rounded-2xl">
                <p className="text-xs text-white/40 mb-3">Letzte 7 Tage</p>
                <div className="flex items-end gap-1 h-16">
                  {waterData.recentEntries.map((entry: any, i: number) => {
                    const glasses = entry.glasses || 0;
                    const height = (glasses / waterData.dailyGoal) * 100;
                    const hitGoal = glasses >= waterData.dailyGoal;
                    return (
                      <div key={i} className="flex-1 group relative">
                        <div
                          className={cn("rounded-t transition-colors", hitGoal ? "bg-cyan-500/60 hover:bg-cyan-400" : "bg-white/30 hover:bg-white/50")}
                          style={{ height: `${Math.max(height, 10)}%` }}
                        />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-white/40 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {glasses}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nutrition Tracker */}
        {activeTab === "tracker" && (
          <div className="p-8 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 backdrop-blur-xl rounded-3xl border border-orange-500/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-xl">
                  <span className="text-2xl">🍽️</span>
                </div>
                <h2 className="text-xl font-bold">Nutrition Tracker</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-400">{nutritionData.dailyNutrition.calories}</p>
                  <p className="text-xs text-white/40">kcal heute</p>
                </div>
              </div>
            </div>

            {/* Daily Progress */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: "Calories", value: nutritionData.dailyNutrition.calories, goal: nutritionData.dailyGoals.calories, color: "orange" },
                { label: "Protein", value: nutritionData.dailyNutrition.protein, goal: nutritionData.dailyGoals.protein, color: "red" },
                { label: "Carbs", value: nutritionData.dailyNutrition.carbs, goal: nutritionData.dailyGoals.carbs, color: "yellow" },
                { label: "Fat", value: nutritionData.dailyNutrition.fat, goal: nutritionData.dailyGoals.fat || 80, color: "gray" },
              ].map(item => {
                const pct = item.goal > 0 ? Math.round((item.value / item.goal) * 100) : 0;
                const colorMap: Record<string, string> = { orange: "from-orange-500 to-red-500", red: "from-red-500 to-pink-500", yellow: "from-yellow-500 to-amber-500", gray: "from-gray-500 to-gray-600" };
                return (
                  <div key={item.label} className="p-3 bg-white/5 rounded-xl text-center">
                    <p className="text-xs text-white/40 mb-1">{item.label}</p>
                    <p className={`text-lg font-bold text-${item.color}-400`}>{item.value}/{item.goal}g</p>
                    <div className="mt-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", colorMap[item.color].replace("from-", "bg-").replace(" to-", ""))} style={{ width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, var(--tw-gradient-stops))` }} />
                    </div>
                    <p className="text-xs text-white/30 mt-0.5">{pct}%</p>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Form */}
            <div className="p-4 bg-white/5 rounded-2xl mb-4">
              <p className="text-sm font-medium text-white/60 mb-3">Quick Add Meal</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Meal name (e.g. Oatmeal)"
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 outline-none focus:border-orange-500/50"
                  value={newMeal.name}
                  onChange={e => setNewMeal({ ...newMeal, name: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="kcal"
                  className="w-20 px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 outline-none focus:border-orange-500/50"
                  value={newMeal.calories}
                  onChange={e => setNewMeal({ ...newMeal, calories: e.target.value })}
                />
              </div>
              <div className="flex gap-2 mb-2">
                <input type="number" placeholder="Protein (g)" className="flex-1 px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 outline-none focus:border-orange-500/50" value={newMeal.protein} onChange={e => setNewMeal({ ...newMeal, protein: e.target.value })} />
                <input type="number" placeholder="Carbs (g)" className="flex-1 px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 outline-none focus:border-orange-500/50" value={newMeal.carbs} onChange={e => setNewMeal({ ...newMeal, carbs: e.target.value })} />
              </div>
              <button
                onClick={addMeal}
                className="w-full py-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 rounded-xl font-bold text-white text-sm transition-all active:scale-[0.98]"
              >
                + Add Meal
              </button>
            </div>

            {/* Today's Meals */}
            {nutritionData.todayMeals && nutritionData.todayMeals.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-white/40 mb-2">Today's Meals</p>
                {nutritionData.todayMeals.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-white/80">{m.name}</p>
                      <p className="text-xs text-white/40">{m.calories} kcal · {m.protein}g P · {m.carbs}g C</p>
                    </div>
                    <span className="text-xs text-white/30">{m.time ? new Date(m.time).toLocaleTimeString("de", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Weekly Avg */}
            {nutritionData.weeklyAvg && (nutritionData.weeklyAvg.calories > 0 || nutritionData.weeklyAvg.protein > 0) && (
              <div className="mt-4 p-3 bg-white/5 rounded-xl text-center">
                <p className="text-xs text-white/40">Ø 7 Tage: {nutritionData.weeklyAvg.calories} kcal, {nutritionData.weeklyAvg.protein}g Protein</p>
              </div>
            )}
          </div>
        )}

        {/* Bucket List */}
        {activeTab === "tracker" && (
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

          {/* Progress Overview */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {(() => {
              const total = bucketList.length;
              const done = bucketList.filter(i => i.completed).length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <>
                  <div className="p-4 bg-white/5 rounded-2xl text-center border border-white/10">
                    <p className="text-2xl font-bold text-purple-300">{done}/{total}</p>
                    <p className="text-xs text-white/40 mt-1">Completed</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl text-center border border-white/10">
                    <p className="text-2xl font-bold text-green-400">{pct}%</p>
                    <p className="text-xs text-white/40 mt-1">Progress</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl text-center border border-white/10">
                    <p className="text-2xl font-bold text-amber-400">{total - done}</p>
                    <p className="text-xs text-white/40 mt-1">Remaining</p>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Category breakdown */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {(() => {
              const cats = Array.from(new Set(bucketList.map(i => i.category || 'other')));
              return cats.map(cat => {
                const total = bucketList.filter(i => (i.category || 'other') === cat).length;
                const done = bucketList.filter(i => (i.category || 'other') === cat && i.completed).length;
                const catColors: Record<string, string> = {
                  financial: 'bg-green-500/20 text-green-300 border-green-500/30',
                  career: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
                  health: 'bg-red-500/20 text-red-300 border-red-500/30',
                  creative: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
                  other: 'bg-white/10 text-white/60 border-white/20',
                };
                return (
                  <span key={cat} className={cn("px-3 py-1 rounded-full text-xs border capitalize", catColors[cat] || catColors.other)}>
                    {cat} {done}/{total}
                  </span>
                );
              });
            })()}
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <button
              onClick={() => setBucketCategory("all")}
              className={cn("px-3 py-1 rounded-full text-xs border transition-all",
                bucketCategory === "all" ? "bg-purple-500/30 text-purple-300 border-purple-500/40" : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10")
              }
            >
              All
            </button>
            {["financial", "career", "health", "creative"].map(cat => (
              <button
                key={cat}
                onClick={() => setBucketCategory(cat)}
                className={cn("px-3 py-1 rounded-full text-xs border capitalize transition-all",
                  bucketCategory === cat ? "bg-purple-500/30 text-purple-300 border-purple-500/40" : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10")
                }
              >
                {cat}
              </button>
            ))}
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
            <select
              value={newBucketCategory}
              onChange={e => setNewBucketCategory(e.target.value)}
              className="px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70 text-sm focus:outline-none"
            >
              <option value="financial">Financial</option>
              <option value="career">Career</option>
              <option value="health">Health</option>
              <option value="creative">Creative</option>
              <option value="other">Other</option>
            </select>
            <button
              onClick={addBucketItem}
              className="px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-400 font-medium transition-all"
            >
              + Add
            </button>
          </div>

          <div className="space-y-4">
            {(bucketCategory === "all" ? bucketList : bucketList.filter(i => i.category === bucketCategory)).map((item) => (
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
                  {item.notes && !item.completed && <p className="text-xs text-white/30 mt-1 italic">{item.notes}</p>}
                </div>
                {item.category && (
                  <span className={cn("px-2 py-0.5 rounded-full text-xs capitalize border",
                    item.category === 'financial' ? 'bg-green-500/10 text-green-300 border-green-500/20' :
                    item.category === 'career' ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' :
                    item.category === 'health' ? 'bg-red-500/10 text-red-300 border-red-500/20' :
                    item.category === 'creative' ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' :
                    'bg-white/5 text-white/40 border-white/10'
                  )}>
                    {item.category}
                  </span>
                )}
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <Circle className="w-5 h-5 text-white/30" />
                )}
              </div>
            ))}
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
                  €{finances.savings.toLocaleString()}
                </p>
                {/* Savings Goal Progress */}
                {finances.savingsGoals && finances.savingsGoals.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {finances.savingsGoals.map((goal: any) => {
                      const progress = Math.min((goal.current / goal.target) * 100, 100);
                      return (
                        <div key={goal.id} className="bg-white/5 rounded-xl p-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-white/50">{goal.name}</span>
                            <span className="text-white/70">€{goal.current.toLocaleString()} / €{goal.target.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-8 bg-gradient-to-br from-amber-500/20 to-orange-500/10 backdrop-blur-xl rounded-3xl border border-amber-500/20">
                <p className="text-sm text-white/50 mb-2">Crypto / Bitcoin</p>
                <p className="text-5xl font-bold text-amber-400">
                  €{finances.crypto.toLocaleString()}
                </p>
              </div>

              <div className="p-8 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 backdrop-blur-xl rounded-3xl border border-blue-500/20">
                <p className="text-sm text-white/50 mb-2">Monthly Costs</p>
                <p className="text-5xl font-bold text-blue-400">
                  €{finances.monthlyCosts.toLocaleString()}
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
                    €{finances.funding?.amount?.toLocaleString() || 12000}/mo
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/50 mb-1">Expected Response</p>
                  <p className="text-3xl font-bold text-purple-300">
                    {finances.funding?.expected || "May/June 2026"}
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
                    €{(finances.savings + finances.crypto).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/50">Runway</p>
                  <p className="text-3xl font-bold text-white">
                    ~{Math.round((finances.savings + finances.crypto) / finances.monthlyCosts)} months
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Add Transaction */}
            <div className="p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-xl rounded-3xl border border-indigo-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                  <DollarSign className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold">Quick Transaction</h3>
              </div>
              <div className="flex gap-3">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="quick-amount"
                  placeholder="Betrag (€)"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-bold placeholder-white/30 focus:outline-none focus:border-indigo-500/50"
                />
                <select
                  id="quick-type"
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70 focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="expense">− Expense</option>
                  <option value="income">+ Income</option>
                </select>
                <select
                  id="quick-category"
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70 focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="other">Other</option>
                  <option value="food">Food</option>
                  <option value="transport">Transport</option>
                  <option value="utilities">Utilities</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="health">Health</option>
                  <option value="savings">Savings</option>
                  <option value="crypto">Crypto</option>
                </select>
              </div>
              <input
                type="text"
                id="quick-description"
                placeholder="Beschreibung (optional)"
                className="mt-3 w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50"
              />
              <button
                onClick={async () => {
                  const amountEl = document.getElementById('quick-amount') as HTMLInputElement;
                  const typeEl = document.getElementById('quick-type') as HTMLSelectElement;
                  const categoryEl = document.getElementById('quick-category') as HTMLSelectElement;
                  const descEl = document.getElementById('quick-description') as HTMLInputElement;
                  
                  const amount = parseFloat(amountEl.value);
                  if (isNaN(amount) || amount <= 0) return;
                  
                  const res = await fetch("/api/finance", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "addTransaction",
                      type: typeEl.value,
                      category: categoryEl.value,
                      amount,
                      description: descEl.value
                    }),
                  });
                  
                  if (res.ok) {
                    const data = await res.json();
                    setFinances(data.data);
                    amountEl.value = '';
                    descEl.value = '';
                  }
                }}
                className="mt-3 w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl font-bold text-white transition-all"
              >
                + Add Transaction
              </button>
            </div>

            {/* Monthly Spending by Category */}
            <div className="p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-xl rounded-3xl border border-cyan-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-cyan-500/20 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold">Monthly Spending Breakdown</h3>
              </div>

              {/* Month selector */}
              <div className="flex items-center gap-3 mb-6">
                {(() => {
                  const currentMonth = new Date();
                  const months = [];
                  for (let i = 0; i < 6; i++) {
                    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - i, 1);
                    months.push(d);
                  }
                  return months.map((month) => {
                    const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
                    const monthLabel = month.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
                    const monthTx = finances.transactions.filter((t: any) => {
                      if (t.type !== 'expense') return false;
                      const tMonth = t.date ? t.date.slice(0, 7) : '';
                      return tMonth === monthKey;
                    });
                    const total = monthTx.reduce((sum: number, t: any) => sum + t.amount, 0);
                    const isCurrentMonth = monthKey === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                    return (
                      <div key={monthKey} className={cn(
                        "flex-1 p-3 rounded-xl text-center border transition-all",
                        isCurrentMonth ? "bg-white/10 border-cyan-500/40" : "bg-white/5 border-white/10"
                      )}>
                        <p className="text-xs text-white/50 mb-1">{monthLabel}</p>
                        <p className={cn("text-sm font-bold", total > 0 ? "text-cyan-400" : "text-white/30")}>
                          {total > 0 ? `€${total.toLocaleString()}` : "—"}
                        </p>
                        <p className="text-xs text-white/30">{monthTx.length} tx</p>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Category breakdown for current month */}
              {(() => {
                const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                const currentMonthTx = finances.transactions.filter((t: any) => {
                  if (t.type !== 'expense') return false;
                  const tMonth = t.date ? t.date.slice(0, 7) : '';
                  return tMonth === currentMonthKey;
                });

                if (currentMonthTx.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-white/40 mb-2">No expenses logged this month</p>
                      <p className="text-xs text-white/20">Add transactions above to see your spending breakdown</p>
                    </div>
                  );
                }

                const categoryMap: Record<string, number> = {};
                currentMonthTx.forEach((t: any) => {
                  categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
                });

                const totalExpenses = Object.values(categoryMap).reduce((a, b) => a + b, 0);
                const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

                const categoryColors: Record<string, string> = {
                  food: "from-orange-500 to-red-500",
                  transport: "from-blue-500 to-cyan-500",
                  utilities: "from-gray-500 to-slate-500",
                  entertainment: "from-pink-500 to-rose-500",
                  health: "from-green-500 to-emerald-500",
                  savings: "from-amber-500 to-yellow-500",
                  crypto: "from-purple-500 to-indigo-500",
                  other: "from-slate-500 to-zinc-500"
                };

                return (
                  <>
                    {/* Bar chart */}
                    <div className="mb-4">
                      {categories.map(([cat, amount]) => {
                        const pct = (amount / totalExpenses) * 100;
                        const color = categoryColors[cat] || categoryColors.other;
                        return (
                          <div key={cat} className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-white/70 capitalize flex items-center gap-2">
                                <span className={cn("w-2 h-2 rounded-full bg-gradient-to-r", color)} />
                                {cat}
                              </span>
                              <span className="text-white/50">€{amount.toLocaleString()} <span className="text-white/30">({pct.toFixed(0)}%)</span></span>
                            </div>
                            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full bg-gradient-to-r rounded-full transition-all duration-500", color)}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-white/60 font-medium">Total Expenses</span>
                      <span className="text-xl font-bold text-red-400">−€{totalExpenses.toLocaleString()}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Recent Transactions */}
            {finances.transactions && finances.transactions.length > 0 && (
              <div className="p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
                <h3 className="text-lg font-bold mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  {finances.transactions.slice(-5).reverse().map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={tx.type === "income" ? "text-green-400" : "text-red-400"}>
                          {tx.type === "income" ? "+" : "−"}
                        </div>
                        <div>
                          <p className="font-medium">{tx.description || tx.category}</p>
                          <p className="text-xs text-white/40">
                            {new Date(tx.date).toLocaleDateString('de-DE')} • {tx.category}
                          </p>
                        </div>
                      </div>
                      <div className={tx.type === "income" ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                        {tx.type === "income" ? "+" : "−"}€{tx.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FI Roadmap */}
            <div className="p-8 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10 backdrop-blur-xl rounded-3xl border border-amber-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <Target className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold">FI Roadmap</h3>
              </div>

              {/* Current Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-4 bg-white/5 rounded-xl text-center border border-white/10">
                  <p className="text-xs text-white/40 mb-1">Net Worth</p>
                  <p className="text-lg font-bold text-amber-400">€{(finances.savings + finances.crypto).toLocaleString()}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl text-center border border-white/10">
                  <p className="text-xs text-white/40 mb-1">Monthly Burn</p>
                  <p className="text-lg font-bold text-red-400">€{finances.monthlyCosts.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl text-center border border-white/10">
                  <p className="text-xs text-white/40 mb-1">FI Number (4%)</p>
                  <p className="text-lg font-bold text-green-400">€{((finances.monthlyCosts * 12) * 25).toLocaleString()}</p>
                </div>
              </div>

              {/* Scenarios */}
              <div className="space-y-3">
                <p className="text-sm text-white/50 mb-3">Path to Financial Independence</p>

                {/* Scenario 1: Current path (no grant, trading only) */}
                {(() => {
                  const netWorth = finances.savings + finances.crypto;
                  const monthlyBurn = finances.monthlyCosts;
                  const fiNumber = monthlyBurn * 12 * 25; // 4% rule
                  // Conservative ETF return: 7% p.a. = 0.58%/month. No regular income, so in deficit.
                  const monthlyReturn = netWorth > 0 ? netWorth * 0.0058 : 0; // 7% annual ETF return
                  const monthlyDeficit = monthlyBurn; // No income = losing €1000/mo
                  const netMonthlyChange = monthlyReturn - monthlyDeficit;
                  // Simple projection: FI unreachable without income (deficit every month)
                  const monthsToFI = netMonthlyChange > 0 ? Math.ceil((fiNumber - netWorth) / netMonthlyChange) : 999;
                  const yearsToFI = Math.min(999, monthsToFI / 12);
                  return (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-white/70">Current Path</p>
                          <p className="text-xs text-white/40">No additional income</p>
                        </div>
                        <span className="text-xs text-white/40">{yearsToFI >= 999 ? '∞' : `${yearsToFI.toFixed(1)} yrs`}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-500 rounded-full" style={{ width: `${Math.min(100, (netWorth / fiNumber) * 100)}%` }} />
                      </div>
                      <p className="text-xs text-white/30 mt-1">{((netWorth / fiNumber) * 100).toFixed(1)}% to FI • €{netWorth.toLocaleString()} / €{fiNumber.toLocaleString()}</p>
                    </div>
                  );
                })()}

                {/* Scenario 2: With €12K/mo grant */}
                {(() => {
                  const netWorth = finances.savings + finances.crypto;
                  const monthlyBurn = finances.monthlyCosts;
                  const grant = 12000;
                  const fiNumber = monthlyBurn * 12 * 25;
                  const monthlySurplus = grant - monthlyBurn; // money saved each month
                  const monthsToFI = monthlySurplus > 0 ? Math.ceil((fiNumber - netWorth) / monthlySurplus) : 999;
                  const yearsToFI = Math.min(999, monthsToFI / 12);
                  const grantDate = new Date('2026-06-01');
                  const fiDate = new Date(grantDate);
                  fiDate.setMonth(fiDate.getMonth() + monthsToFI);
                  return (
                    <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/5 rounded-xl border border-green-500/20">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-green-300">With €12K/mo Grant</p>
                          <p className="text-xs text-white/40">+€{(12000 - monthlyBurn).toLocaleString()}/mo surplus</p>
                        </div>
                        <span className="text-xs text-green-400 font-bold">{yearsToFI >= 999 ? '∞' : `${yearsToFI.toFixed(1)} yrs`}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all" style={{ width: `${Math.min(100, (netWorth / fiNumber) * 100)}%` }} />
                      </div>
                      <p className="text-xs text-white/30 mt-1">
                        {monthsToFI < 999 ? `FI by ${fiDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}` : 'FI number too high'}
                        {' • '}{((netWorth / fiNumber) * 100).toFixed(1)}% to FI
                      </p>
                    </div>
                  );
                })()}

                {/* Scenario 3: Aggressive (FI = €300K for lean FI) */}
                {(() => {
                  const netWorth = finances.savings + finances.crypto;
                  const leanFI = 300000; // €25K/year lifestyle
                  const monthlyBurn = finances.monthlyCosts;
                  const grant = 12000;
                  const monthlySurplus = grant - monthlyBurn;
                  const monthsToFI = monthlySurplus > 0 ? Math.ceil((leanFI - netWorth) / monthlySurplus) : 999;
                  const yearsToFI = Math.min(999, monthsToFI / 12);
                  const grantDate = new Date('2026-06-01');
                  const fiDate = new Date(grantDate);
                  fiDate.setMonth(fiDate.getMonth() + monthsToFI);
                  return (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-purple-300">Lean FI (€300K)</p>
                          <p className="text-xs text-white/40">€25K/year lifestyle</p>
                        </div>
                        <span className="text-xs text-purple-400 font-bold">{yearsToFI >= 999 ? '∞' : `${yearsToFI.toFixed(1)} yrs`}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full" style={{ width: `${Math.min(100, (netWorth / leanFI) * 100)}%` }} />
                      </div>
                      <p className="text-xs text-white/30 mt-1">
                        {monthsToFI < 999 ? `FI by ${fiDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}` : 'FI number too high'}
                        {' • '}{((netWorth / leanFI) * 100).toFixed(1)}% to FI
                      </p>
                    </div>
                  );
                })()}
              </div>

              <p className="text-xs text-white/20 mt-4 text-center">
                FI Number = 25× annual expenses (4% rule) • Assumes grant starts June 2026
              </p>
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

        {/* Weight Modal */}
        {showWeightModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 bg-[#111] rounded-3xl border border-white/20 shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <TrendingDown className="w-5 h-5 text-blue-400" />
                </div>
                Gewicht loggen
              </h3>

              {/* Weight Input */}
              <div className="mb-5">
                <label className="block text-sm text-white/50 mb-2">Gewicht (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="200"
                  value={weightValue}
                  onChange={(e) => setWeightValue(e.target.value)}
                  placeholder="z.B. 82.5"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-2xl font-bold placeholder-white/30 focus:outline-none focus:border-blue-500/50 text-center"
                  autoFocus
                />
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm text-white/50 mb-2">Notiz (optional)</label>
                <textarea
                  value={weightNotes}
                  onChange={(e) => setWeightNotes(e.target.value)}
                  placeholder="z.B. nach Workout, morgens nüchtern..."
                  rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWeightModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 font-medium transition-all"
                >
                  Abbrechen
                </button>
                <button
                  onClick={confirmWeightLog}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-bold text-white transition-all"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mood Modal */}
        {showMoodModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 bg-[#111] rounded-3xl border border-white/20 shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="p-2 bg-rose-500/20 rounded-xl">
                  <span className="text-xl">💭</span>
                </div>
                Stimmung & Energy
              </h3>

              {/* Energy Slider */}
              <div className="mb-6">
                <label className="block text-sm text-white/50 mb-2">Energy Level: {moodEnergy}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={moodEnergy}
                  onChange={e => setMoodEnergy(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
                <div className="flex justify-between text-xs text-white/30 mt-1">
                  <span>Erschöpft</span>
                  <span>Volle Power</span>
                </div>
              </div>

              {/* Mood Slider */}
              <div className="mb-6">
                <label className="block text-sm text-white/50 mb-2">Stimmung: {moodValue}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={moodValue}
                  onChange={e => setMoodValue(Number(e.target.value))}
                  className="w-full accent-pink-500"
                />
                <div className="flex justify-between text-xs text-white/30 mt-1">
                  <span>Schlecht</span>
                  <span>Super</span>
                </div>
              </div>

              {/* Note */}
              <div className="mb-6">
                <label className="block text-sm text-white/50 mb-2">Notiz (optional)</label>
                <textarea
                  value={moodNote}
                  onChange={e => setMoodNote(e.target.value)}
                  placeholder="Was beeinflusst deine Stimmung heute?"
                  rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMoodModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 font-medium transition-all"
                >
                  Abbrechen
                </button>
                <button
                  onClick={confirmMoodLog}
                  className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-xl font-bold text-white transition-all"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wellness Modal */}
        {showWellnessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 bg-[#111] rounded-3xl border border-violet-500/30 shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="p-2 bg-violet-500/20 rounded-xl">
                  <span className="text-xl">🧘</span>
                </div>
                Meditation loggen
              </h3>

              {/* Duration */}
              <div className="mb-5">
                <label className="block text-sm text-white/50 mb-2">Dauer: {wellnessMinutes} Minuten</label>
                <input
                  type="range"
                  min="1"
                  max="60"
                  step="1"
                  value={wellnessMinutes}
                  onChange={e => setWellnessMinutes(Number(e.target.value))}
                  className="w-full accent-violet-500"
                />
                <div className="flex justify-between text-xs text-white/30 mt-1">
                  <span>1 Min</span>
                  <span>60 Min</span>
                </div>
              </div>

              {/* Type */}
              <div className="mb-5">
                <label className="block text-sm text-white/50 mb-2">Art</label>
                <div className="grid grid-cols-3 gap-2">
                  {["mindfulness", "breathing", "body-scan"].map(type => (
                    <button
                      key={type}
                      onClick={() => setWellnessType(type)}
                      className={cn(
                        "p-3 rounded-xl text-sm font-medium capitalize transition-all",
                        wellnessType === type
                          ? "bg-violet-500/30 border border-violet-500/50 text-violet-300"
                          : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                      )}
                    >
                      {type.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="mb-6">
                <label className="block text-sm text-white/50 mb-2">Notiz (optional)</label>
                <textarea
                  value={wellnessNote}
                  onChange={e => setWellnessNote(e.target.value)}
                  placeholder="Wie war die Session?"
                  rows={2}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWellnessModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 font-medium transition-all"
                >
                  Abbrechen
                </button>
                <button
                  onClick={confirmWellnessLog}
                  className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 rounded-xl font-bold text-white transition-all"
                >
                  Speichern
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