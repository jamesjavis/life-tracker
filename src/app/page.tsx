"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Rocket, DollarSign, TrendingUp, Target, Zap, Globe,
  Briefcase, Wallet, ChevronRight, ExternalLink,
  Activity, Calendar, Award, Gift, CheckCircle2, Circle,
  Dumbbell, Flame, Star, TrendingDown, Cloud, CloudRain,
  CloudSnow, Sun, CloudLightning, Wind, Droplets, Moon, BarChart3, Pill
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
  { id: "yoga", label: "Yoga", emoji: "🧘" },
  { id: "meditation", label: "Meditation", emoji: "🧘‍♂️" },
  { id: "gym", label: "Gym", emoji: "💪" },
  { id: "bauchworkout", label: "Bauch", emoji: "🏋️" },
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
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "finances" | "tracker" | "trends">("overview");
  const [habits, setHabits] = useState<Record<string, boolean>>({});
  const [gymStreak, setGymStreak] = useState(0);
  const [gymLogs, setGymLogs] = useState<string[]>([]);
  const [gymComeback, setGymComeback] = useState<any>(null);
  const [gymStats, setGymStats] = useState<any>(null);
  const [bucketList, setBucketList] = useState<any[]>(BUCKET_LIST);
  const [habitStreaks, setHabitStreaks] = useState<Record<string, { current: number; longest: number; last7: boolean[] }>>({});
  const [habitHistory, setHabitHistory] = useState<{ weeks: Array<Array<{ date: string; completion: number; completed: number; total: number }>>; stats: { totalDays: number; perfectDays: number; avgCompletion: number; longestPerfect: number } }>({ weeks: [], stats: { totalDays: 0, perfectDays: 0, avgCompletion: 0, longestPerfect: 0 } });
  const [weekSummaryData, setWeekSummaryData] = useState<{ days: any[]; streaks: any; trends: any } | null>(null);
  const [weekSummaryError, setWeekSummaryError] = useState(false);

  // Find last date with logged habits from history
  const lastHabitDateStr = useMemo(() => {
    let last: string | null = null;
    habitHistory.weeks.forEach(week => {
      week.forEach(day => {
        if (day.date && day.total > 0 && (!last || day.date > last)) last = day.date;
      });
    });
    return last;
  }, [habitHistory]);
  const daysSinceLastHabit = useMemo(() => lastHabitDateStr
    ? Math.floor((Date.now() - new Date(lastHabitDateStr + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24))
    : null, [lastHabitDateStr]);

  // Gym heatmap: 16 weeks (Mon→Sun rows, columns = weeks) — computed from gymLogs
  const gymHeatmapWeeks = useMemo(() => {
    const weeks: { date: string; hasGym: boolean; isToday: boolean; isFuture: boolean }[][] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];
    const gymSet = new Set(gymLogs);
    const start = new Date(today);
    const dayOfWeek = start.getDay(); // 0=Sun
    const daysToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    start.setDate(start.getDate() - daysToMon - 15 * 7); // 16 weeks back, start Mon
    for (let w = 0; w < 16; w++) {
      const week: { date: string; hasGym: boolean; isToday: boolean; isFuture: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        const dateStr = date.toISOString().split("T")[0];
        week.push({ date: dateStr, hasGym: gymSet.has(dateStr), isToday: dateStr === todayStr, isFuture: date > today });
      }
      weeks.push(week);
    }
    return weeks;
  }, [gymLogs]);

  // Gym rest days gap
  const gymGapDays = useMemo(() => {
    if (!gymLogs || gymLogs.length === 0) return null;
    const last = gymLogs[gymLogs.length - 1];
    const lastDate = new Date(last + "T00:00:00");
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    return Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000);
  }, [gymLogs]);

  const [newBucketText, setNewBucketText] = useState("");
  const [bucketCategory, setBucketCategory] = useState<string>("all");
  const [newBucketCategory, setNewBucketCategory] = useState<string>("other");
  const [loading, setLoading] = useState(true);
  const [trendsData, setTrendsData] = useState<{ days: any[]; weeks: any[]; streaks: any; trends: any; generatedAt: string } | null>(null);
  const [wellnessScore, setWellnessScore] = useState<number | null>(null);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutType, setWorkoutType] = useState("strength");
  const [workoutDuration, setWorkoutDuration] = useState(60);
  const [workoutIntensity, setWorkoutIntensity] = useState("medium");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [workoutHistory, setWorkoutHistory] = useState<Record<string, ({ type: string; duration: number; intensity: string; notes?: string } | { muscles: string[]; exercises: string[]; notes?: string; timestamp?: string })>>({});
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

  // Weekend Challenge
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const [weekendBonusClaimed, setWeekendBonusClaimed] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('weekendBonusClaimed') : null;
    const todayStr = today.toISOString().split('T')[0];
    return saved === todayStr;
  });

  async function claimWeekendBonus() {
    const todayStr = today.toISOString().split('T')[0];
    // Toggle all habits ON for today as a bonus
    await Promise.all(HABITS.map(habit =>
      fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId: habit.id, completed: true, date: todayStr }),
      })
    ));
    // Refresh habits
    const habitsRes = await fetch("/api/habits");
    if (habitsRes.ok) {
      const habitsData = await habitsRes.json();
      setHabits(habitsData.habits?.[todayStr] || {});
    }
    setWeekendBonusClaimed(true);
    if (typeof window !== 'undefined') localStorage.setItem('weekendBonusClaimed', todayStr);
  }

  // Strength training exercise logging
  const [workoutExercises, setWorkoutExercises] = useState<Array<{ name: string; sets: number; reps: number; weight: number }>>([]);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseSets, setNewExerciseSets] = useState(3);
  const [newExerciseReps, setNewExerciseReps] = useState(10);
  const [newExerciseWeight, setNewExerciseWeight] = useState(0);

  const COMMON_EXERCISES: Record<string, string[]> = {
    Chest: ["Bench Press", "Incline Bench Press", "Dumbbell Fly", "Push-ups", "Cable Crossover"],
    Back: ["Pull-ups", "Barbell Row", "Lat Pulldown", "Seated Row", "Deadlift"],
    Shoulders: ["Overhead Press", "Lateral Raise", "Face Pull", "Shrugs", "Arnold Press"],
    Arms: ["Bicep Curl", "Tricep Pushdown", "Hammer Curl", "Skull Crushers", "Preacher Curl"],
    Legs: ["Squat", "Leg Press", "Romanian Deadlift", "Leg Curl", "Leg Extension", "Calf Raise"],
    Core: ["Plank", "Cable Crunch", "Hanging Leg Raise", "Russian Twist", "Ab Wheel"]
  };

  function addExercise() {
    if (!newExerciseName.trim()) return;
    setWorkoutExercises(prev => [...prev, {
      name: newExerciseName.trim(),
      sets: newExerciseSets,
      reps: newExerciseReps,
      weight: newExerciseWeight
    }]);
    setNewExerciseName("");
    setNewExerciseSets(3);
    setNewExerciseReps(10);
    setNewExerciseWeight(0);
  }

  function removeExercise(idx: number) {
    setWorkoutExercises(prev => prev.filter((_, i) => i !== idx));
  }


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
    lastEntry: string | null;
    daysSinceLastEntry: number | null;
    recentEntries: any[];
  }>({ dailyGoal: 8, todayGlasses: 0, todayProgress: 0, weeklyAvg: 0, streak: 0, lastEntry: null, daysSinceLastEntry: null, recentEntries: [] });

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
  const [sleepComeback, setSleepComeback] = useState<any>(null);
  const [moodComeback, setMoodComeback] = useState<any>(null);
  const [habitsComeback, setHabitsComeback] = useState<any>(null);
  const [supplementsComeback, setSupplementsComeback] = useState<any>(null);
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

  // Transaction form state
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [txCategory, setTxCategory] = useState("other");
  const [txDescription, setTxDescription] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

  // FI Roadmap data from API
  const [roadmapData, setRoadmapData] = useState<{
    current: any;
    target: number;
    monthsTo50K: number | null;
    milestones: any[];
    projectionLine: any[];
    summary: any;
  } | null>(null);

  // Net Worth History
  const [networthHistory, setNetworthHistory] = useState<{
    history: any[];
    current: any;
    milestones: any[];
    monthsTo12K: number | null;
    monthsTo25K: number | null;
    monthsTo50K: number | null;
    target: number;
  } | null>(null);

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

  // Breathing exercise state
  const [breathingData, setBreathingData] = useState<{
    sessions: any[];
    today: any[] | null;
    stats: { totalSessions: number; totalMinutes: number; avgDuration: number; streak: number; last7Count: number; todayCount: number };
  }>({ sessions: [], today: null, stats: { totalSessions: 0, totalMinutes: 0, avgDuration: 0, streak: 0, last7Count: 0, todayCount: 0 } });

  // Supplements tracking
  const [supplementsData, setSupplementsData] = useState<{
    supplements: any[];
    takenToday: number;
    total: number;
  }>({ supplements: [], takenToday: 0, total: 0 });

  // Pushup Challenge tracking
  const [pushupData, setPushupData] = useState<{
    currentDay: number;
    todayReps: number | null;
    todayCompleted: boolean;
    totalDays: number;
    totalReps: number;
    avgReps: number;
    maxReps: number;
    currentStreak: number;
    last30: any[];
  }>({ currentDay: 0, todayReps: null, todayCompleted: false, totalDays: 0, totalReps: 0, avgReps: 0, maxReps: 0, currentStreak: 0, last30: [] });

  // Retro-Log state
  const [showRetroModal, setShowRetroModal] = useState(false);
  const [retroDate, setRetroDate] = useState(new Date().toISOString().split("T")[0]);
  const [retroCategory, setRetroCategory] = useState<"habits" | "sleep" | "gym" | "mood" | "water">("habits");
  const [retroHabits, setRetroHabits] = useState<Record<string, boolean>>({});
  const [retroSleepHours, setRetroSleepHours] = useState(7);
  const [retroSleepQuality, setRetroSleepQuality] = useState(5);
  const [retroGymMuscles, setRetroGymMuscles] = useState("");
  const [retroGymExercises, setRetroGymExercises] = useState("");
  const [retroGymNotes, setRetroGymNotes] = useState("");
  const [retroMoodEnergy, setRetroMoodEnergy] = useState(5);
  const [retroMoodValue, setRetroMoodValue] = useState(5);
  const [retroMoodNote, setRetroMoodNote] = useState("");
  const [retroWater, setRetroWater] = useState(8);
  const [retroSaving, setRetroSaving] = useState(false);
  const [retroBulkMode, setRetroBulkMode] = useState(false);
  const [retroBulkCategory, setRetroBulkCategory] = useState<"habits" | "sleep" | "mood">("habits");
  const [retroBulkHabits, setRetroBulkHabits] = useState<Record<string, boolean>>({});
  const [retroBulkSleepH, setRetroBulkSleepH] = useState(7);
  const [retroBulkSleepQ, setRetroBulkSleepQ] = useState(5);
  const [retroBulkMoodE, setRetroBulkMoodE] = useState(6);
  const [retroBulkMoodV, setRetroBulkMoodV] = useState(6);
  const [retroBulkEndDate, setRetroBulkEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [pushupInput, setPushupInput] = useState("");
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPattern, setBreathingPattern] = useState("box");
  const [breathingPhase, setBreathingPhase] = useState("idle");
  const [breathingSeconds, setBreathingSeconds] = useState(0);
  const [breathingRounds, setBreathingRounds] = useState(0);

  const BREATHING_PATTERNS: Record<string, { label: string; inhale: number; hold: number; exhale: number; hold2?: number; desc: string }> = {
    box: { label: "Box Breathing", inhale: 4, hold: 4, exhale: 4, hold2: 4, desc: "Equal 4-4-4-4 — Navy SEAL technique for calm focus" },
    "478": { label: "4-7-8 Breathing", inhale: 4, hold: 7, exhale: 8, desc: "Dr. Andrew Weil's relaxation breathing" },
    physio: { label: "Physiological Sigh", inhale: 2, hold: 0, exhale: 6, desc: "Double inhale + long exhale — fastest stress relief" },
    calm: { label: "Deep Calm", inhale: 5, hold: 5, exhale: 8, hold2: 0, desc: "Long exhales for deep relaxation" },
  };

  async function logBreathingSession(duration: number, rounds: number) {
    await fetch("/api/breathing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "log", duration, rounds, pattern: breathingPattern })
    });
    const res = await fetch("/api/breathing");
    if (res.ok) setBreathingData(await res.json());
  }

  async function toggleSupplement(supplementId: string) {
    try {
      await fetch("/api/supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "take", supplementId }),
      });
      const res = await fetch("/api/supplements");
      if (res.ok) setSupplementsData(await res.json());
    } catch (e) {
      console.error("Failed to toggle supplement", e);
    }
  }

  async function logAllSupplements() {
    const notTaken = supplementsData.supplements.filter((s: any) => !s.taken);
    if (notTaken.length === 0) return;
    try {
      await Promise.all(notTaken.map((s: any) =>
        fetch("/api/supplements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "take", supplementId: s.id }),
        })
      ));
      const res = await fetch("/api/supplements");
      if (res.ok) setSupplementsData(await res.json());
    } catch (e) {
      console.error("Failed to log all supplements", e);
    }
  }

  // Pushup Challenge logging
  async function logPushups(reps?: number) {
    const repsToLog = reps ?? pushupData.currentDay;
    try {
      const res = await fetch("/api/pushups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reps: repsToLog }),
      });
      if (res.ok) {
        const result = await res.json();
        setPushupData(prev => ({
          ...prev,
          todayReps: repsToLog,
          todayCompleted: true,
          currentDay: result.currentDay,
        }));
      }
    } catch (e) {
      console.error("Failed to log pushups", e);
    }
  }

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

  // Fetch week-summary with proper React state (not DOM manipulation)
  useEffect(() => {
    let cancelled = false;
    async function loadWeekSummary() {
      try {
        const res = await fetch("/api/week-summary");
        if (cancelled) return;
        if (!res.ok) throw new Error("week-summary failed");
        const data = await res.json();
        if (cancelled) return;
        setWeekSummaryData({ days: data.days || [], streaks: data.streaks, trends: data.trends });
        setWeekSummaryError(false);
      } catch {
        if (!cancelled) setWeekSummaryError(true);
      }
    }
    loadWeekSummary();
    return () => { cancelled = true; };
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
        if (gymData.stats) setGymStats(gymData.stats);
      }

      // Fetch gym comeback data
      const comebackRes = await fetch("/api/gym-comeback");
      if (comebackRes.ok) {
        const comebackData = await comebackRes.json();
        setGymComeback(comebackData);
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

      // Fetch FI Roadmap
      try {
        const roadmapRes = await fetch("/api/finance/roadmap");
        if (roadmapRes.ok) {
          const roadmapResult = await roadmapRes.json();
          setRoadmapData(roadmapResult);
        }
      } catch (e) {
        console.error("Failed to load FI roadmap", e);
      }

      // Fetch Net Worth History
      try {
        const nwRes = await fetch("/api/finance/networth-history");
        if (nwRes.ok) {
          const nwData = await nwRes.json();
          setNetworthHistory(nwData);
        }
      } catch (e) {
        console.error("Failed to load networth history", e);
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
      // Fetch sleep comeback data
      try {
        const sleepComebackRes = await fetch("/api/sleep-comeback");
        if (sleepComebackRes.ok) {
          const sleepComebackData = await sleepComebackRes.json();
          setSleepComeback(sleepComebackData);
        }
      } catch (e) {
        console.error("Failed to load sleep comeback", e);
      }
      // Fetch mood comeback data
      try {
        const moodComebackRes = await fetch("/api/mood-comeback");
        if (moodComebackRes.ok) {
          const moodComebackData = await moodComebackRes.json();
          setMoodComeback(moodComebackData);
        }
      } catch (e) {
        console.error("Failed to load mood comeback", e);
      }
      // Fetch habits comeback data
      try {
        const habitsComebackRes = await fetch("/api/habits-comeback");
        if (habitsComebackRes.ok) {
          const habitsComebackData = await habitsComebackRes.json();
          setHabitsComeback(habitsComebackData);
        }
      } catch (e) {
        console.error("Failed to load habits comeback", e);
      }
      // Fetch supplements comeback
      try {
        const supplementsComebackRes = await fetch("/api/supplements-comeback");
        if (supplementsComebackRes.ok) {
          const supplementsComebackData = await supplementsComebackRes.json();
          setSupplementsComeback(supplementsComebackData);
        }
      } catch (e) {
        console.error("Failed to load supplements comeback", e);
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

      // Fetch breathing
      try {
        const breathingRes = await fetch("/api/breathing");
        if (breathingRes.ok) {
          const breathingResult = await breathingRes.json();
          setBreathingData(breathingResult);
        }
      } catch (e) {
        console.error("Failed to load breathing", e);
      }

      // Fetch supplements
      try {
        const supplementsRes = await fetch("/api/supplements");
        if (supplementsRes.ok) {
          const supplementsResult = await supplementsRes.json();
          setSupplementsData(supplementsResult);
        }
      } catch (e) {
        console.error("Failed to load supplements", e);
      }

      // Fetch pushup challenge
      try {
        const pushupsRes = await fetch("/api/pushups");
        if (pushupsRes.ok) {
          const pushupsResult = await pushupsRes.json();
          setPushupData(pushupsResult);
          if (pushupsResult.currentDay > 0) setPushupInput(String(pushupsResult.todayReps || pushupsResult.currentDay));
        }
      } catch (e) {
        console.error("Failed to load pushups", e);
      }

      // Fetch trends
      try {
        const trendsRes = await fetch("/api/trends");
        if (trendsRes.ok) {
          const trendsResult = await trendsRes.json();
          setTrendsData(trendsResult);
        }
      } catch (e) {
        console.error("Failed to load trends", e);
      }

      // Fetch wellness score
      try {
        const wsRes = await fetch("/api/wellness-score");
        if (wsRes.ok) {
          const ws = await wsRes.json();
          setWellnessScore(ws.score);
        }
      } catch (e) {
        console.error("Failed to load wellness score", e);
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

  async function quickLogGym() {
    const today = new Date().toISOString().split("T")[0];
    if (gymLogs.includes(today)) return;
    await fetch("/api/gym", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: today, completed: true }),
    });
    // Refresh gym data
    const res = await fetch("/api/gym");
    if (res.ok) {
      const data = await res.json();
      setGymLogs(data.logs || []);
      setGymStreak(data.streak || 0);
    }
  }

  async function confirmGymLog() {
    const today = new Date().toISOString().split("T")[0];
    if (gymLogs.includes(today)) return;

    const muscles = [...new Set(workoutExercises.map(e => {
      const found = Object.entries(COMMON_EXERCISES).find(([_, exs]) => exs.includes(e.name));
      return found ? found[0] : 'Other';
    }))];

    const workout = workoutType === 'strength' && workoutExercises.length > 0 ? {
      type: workoutType,
      duration: workoutDuration,
      intensity: workoutIntensity,
      notes: workoutNotes,
      muscles,
      exercises: workoutExercises
    } : {
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
      const historyEntry = workoutType === 'strength' && workoutExercises.length > 0
        ? { type: workoutType, duration: workoutDuration, intensity: workoutIntensity, notes: workoutNotes, muscles, exercises: workoutExercises }
        : { type: workoutType, duration: workoutDuration, intensity: workoutIntensity, notes: workoutNotes };
      setWorkoutHistory(prev => ({ ...prev, [today]: historyEntry }));
    }
    setShowWorkoutModal(false);
    // Reset form
    setWorkoutType("strength");
    setWorkoutDuration(60);
    setWorkoutIntensity("medium");
    setWorkoutNotes("");
    setWorkoutExercises([]);
    setNewExerciseName("");
    setNewExerciseSets(3);
    setNewExerciseReps(10);
    setNewExerciseWeight(0);
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

  function openRetroLog() {
    setRetroDate(new Date().toISOString().split("T")[0]);
    setRetroCategory("habits");
    setRetroHabits({});
    setRetroSaving(false);
    setRetroSleepHours(7);
    setRetroSleepQuality(5);
    setRetroGymMuscles("");
    setRetroGymExercises("");
    setRetroGymNotes("");
    setRetroMoodEnergy(5);
    setRetroMoodValue(5);
    setRetroMoodNote("");
    setShowRetroModal(true);
  }

  async function submitRetroLog() {
    setRetroSaving(true);

    try {
      if (retroBulkMode) {
        // Bulk mode: iterate through date range
        const start = new Date(retroDate + "T00:00:00");
        const end = new Date(retroBulkEndDate + "T00:00:00");
        const dates: string[] = [];
        const cur = new Date(start);
        while (cur <= end) {
          dates.push(cur.toISOString().split("T")[0]);
          cur.setDate(cur.getDate() + 1);
        }

        for (const dateStr of dates) {
          if (retroBulkCategory === "habits") {
            const batch = Object.entries(retroBulkHabits).map(([habitId, completed]) => ({ habitId, completed }));
            if (batch.length > 0) {
              await fetch("/api/habits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ batch, date: dateStr }),
              });
            }
          } else if (retroBulkCategory === "sleep") {
            await fetch("/api/sleep", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "log", date: dateStr, duration: retroBulkSleepH, quality: retroBulkSleepQ }),
            });
          } else if (retroBulkCategory === "mood") {
            await fetch("/api/mood", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "log", date: dateStr, energy: retroBulkMoodE, mood: retroBulkMoodV, note: "Bulk Retro-Log" }),
            });
          }
        }
      } else {
        // Single mode
        const dateStr = retroDate;
        if (retroCategory === "habits") {
          const batch = Object.entries(retroHabits).map(([habitId, completed]) => ({ habitId, completed }));
          if (batch.length > 0) {
            await fetch("/api/habits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ batch, date: dateStr }),
            });
          }
        } else if (retroCategory === "sleep") {
          await fetch("/api/sleep", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "log", date: dateStr, duration: retroSleepHours, quality: retroSleepQuality }),
          });
        } else if (retroCategory === "gym") {
          await fetch("/api/gym", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "log",
              date: dateStr,
              muscles: retroGymMuscles.split(",").map((m: string) => m.trim()).filter(Boolean),
              exercises: retroGymExercises.split(",").map((e: string) => e.trim()).filter(Boolean),
              notes: retroGymNotes,
            }),
          });
        } else if (retroCategory === "mood") {
          await fetch("/api/mood", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "log", date: dateStr, energy: retroMoodEnergy, mood: retroMoodValue, note: retroMoodNote }),
          });
        } else if (retroCategory === "water") {
          await fetch("/api/water", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "retro", date: dateStr, glasses: retroWater }),
          });
        }
      }
    } catch (e) {
      console.error("Retro-log failed", e);
    }

    setRetroSaving(false);
    setRetroBulkMode(false);
    setRetroBulkHabits({});
    setShowRetroModal(false);
    if (typeof window !== "undefined") window.location.reload();
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
              { key: "trends", label: "Trends", icon: TrendingUp },
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
            {/* Weekend Challenge Banner */}
            {isWeekend && (
              <div className={cn(
                "p-6 rounded-3xl border backdrop-blur-xl",
                completedCount === HABITS.length
                  ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30"
                  : weekendBonusClaimed
                  ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30"
                  : "bg-gradient-to-r from-purple-500/20 via-pink-500/10 to-cyan-500/20 border-pink-500/30"
              )}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-3 rounded-2xl text-3xl",
                      completedCount === HABITS.length ? "bg-green-500/20" : "bg-pink-500/20"
                    )}>
                      {completedCount === HABITS.length ? "🎉" : "⚡"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold">
                          {dayOfWeek === 6 ? "Samstag" : "Sonntag"} Challenge
                        </h3>
                        {completedCount === HABITS.length && (
                          <span className="px-2 py-0.5 bg-green-500/30 text-green-400 rounded-full text-xs font-bold">ALLES GESCHAFFT!</span>
                        )}
                      </div>
                      {completedCount === HABITS.length ? (
                        <p className="text-sm text-white/60">Perfekter Start ins Wochenende! Genieß den Erfolg. 💪</p>
                      ) : weekendBonusClaimed ? (
                        <p className="text-sm text-white/60">Bonus-Start aktiv! Noch {HABITS.length - completedCount} Habits offen — du rockst das! 🔥</p>
                      ) : (
                        <p className="text-sm text-white/60">
                          Letztes Habit: vor {daysSinceLastHabit ?? "?"} Tagen.
                          Weekend-Bonus: Alle Habits mit einem Klick starten!
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-bold">{completedCount}/{HABITS.length}</p>
                      <p className="text-xs text-white/40">Habits heute</p>
                    </div>
                    {completedCount < HABITS.length && !weekendBonusClaimed && (
                      <button
                        onClick={claimWeekendBonus}
                        className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-xl font-bold text-sm transition-all active:scale-95 whitespace-nowrap"
                      >
                        ⚡ Weekend-Start
                      </button>
                    )}
                    {completedCount < HABITS.length && weekendBonusClaimed && (
                      <span className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl text-sm font-bold">
                        🔥 Im Recovery-Modus
                      </span>
                    )}
                  </div>
                </div>
                {/* Mini habit preview */}
                <div className="mt-4 flex gap-2 flex-wrap">
                  {HABITS.map(habit => (
                    <button
                      key={habit.id}
                      onClick={() => toggleHabit(habit.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                        habits[habit.id]
                          ? "bg-green-500/25 border-green-500/40 text-green-300"
                          : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                      )}
                    >
                      <span>{habit.emoji}</span>
                      <span>{habit.label}</span>
                      {habits[habit.id] ? <span>✓</span> : <span className="text-white/30">○</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gym Comeback Banner — show when gap >= 4 days */}
            {gymComeback && gymComeback.gapDays !== null && gymComeback.gapDays >= 4 && !gymComeback.gymDoneToday && (
              <div className="p-5 rounded-2xl border bg-gradient-to-r from-orange-500/15 to-red-500/10 border-orange-500/25">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-orange-500/20 text-2xl">🏋️</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-orange-300">Gym Comeback</h3>
                      <span className="text-xs text-orange-400/60 font-mono">
                        {gymComeback.gapDays} Tage Pause
                      </span>
                    </div>
                    <p className="text-sm text-white/60 mt-0.5">{gymComeback.motivation}</p>
                  </div>
                </div>

                {gymComeback.comebackPlan && (
                  <div className="bg-black/20 rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-4 text-xs text-white/50 mb-2">
                      <span>📅 {gymComeback.comebackPlan.targetSessions} Sessions</span>
                      <span>⏱️ Alle {gymComeback.avgGapDays} Tage</span>
                      <span>🏆 Best: {gymComeback.longestStreak} Tage</span>
                      <span>📊 {gymComeback.totalSessions} Total</span>
                    </div>
                    <p className="text-xs text-orange-300/80 italic">{gymComeback.comebackPlan.focus}</p>
                  </div>
                )}

                {/* Missed Sessions — Mon/Wed/Fri backfill */}
                {(() => {
                  if (!gymComeback?.lastSession) return null;
                  const lastDate = new Date(gymComeback.lastSession + "T00:00:00");
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const missed: { date: string; label: string }[] = [];
                  const check = new Date(lastDate);
                  check.setDate(check.getDate() + 1);
                  while (check <= today) {
                    const dow = check.getDay();
                    if (dow === 1 || dow === 3 || dow === 5) {
                      const dateStr = check.toISOString().split("T")[0];
                      if (!gymLogs.includes(dateStr)) {
                        const d = new Date(check);
                        missed.push({
                          date: dateStr,
                          label: d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" }),
                        });
                      }
                    }
                    check.setDate(check.getDate() + 1);
                  }
                  if (missed.length === 0) return null;
                  return (
                    <div className="mb-3 p-3 bg-black/20 rounded-xl">
                      <p className="text-xs text-orange-300/70 mb-2 font-medium">Verpasste Sessions — schnell nachholen:</p>
                      <div className="flex gap-2 flex-wrap">
                        {missed.map(m => (
                          <button
                            key={m.date}
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/gym", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ date: m.date, muscles: ["Retro-Log"], exercises: [], notes: "" }),
                                });
                                if (res.ok) {
                                  setGymLogs(prev => [...prev, m.date]);
                                  setGymComeback((prev: any) => prev ? { ...prev, gapDays: 0 } : prev);
                                }
                              } catch {}
                            }}
                            className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/30 rounded-lg text-xs font-medium text-orange-200 transition-all active:scale-95"
                          >
                            📅 {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/40">
                    <span className="font-mono">Letzte: {gymComeback.lastSession}</span>
                    {gymComeback.thisMonthSessions > 0 && (
                      <span className="ml-3">| Diesen Monat: {gymComeback.thisMonthSessions}x</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowWorkoutModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl font-bold text-xs transition-all active:scale-95"
                  >
                    💪 Heute trainieren
                  </button>
                </div>
              </div>
            )}

            {/* Sleep Comeback Banner — show when gap >= 7 days */}
            {sleepComeback && sleepComeback.gapDays !== null && sleepComeback.gapDays >= 7 && (
              <div className="p-5 rounded-2xl border bg-gradient-to-r from-indigo-500/15 to-purple-500/10 border-indigo-500/25">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 text-2xl">🌙</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-indigo-300">Sleep Comeback</h3>
                      <span className="text-xs text-indigo-400/60 font-mono">
                        {sleepComeback.gapDays} Tage Pause
                      </span>
                    </div>
                    <p className="text-sm text-white/60 mt-0.5">{sleepComeback.motivation}</p>
                  </div>
                </div>

                {sleepComeback.comebackPlan && (
                  <div className="bg-black/20 rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-4 text-xs text-white/50 mb-2">
                      <span>📅 {sleepComeback.comebackPlan.targetEntries} Einträge</span>
                      <span>⏱️ Avg: {sleepComeback.avgSleep || '?'}h/night</span>
                      <span>📊 {sleepComeback.totalEntries} Total</span>
                    </div>
                    <p className="text-xs text-indigo-300/80 italic">{sleepComeback.comebackPlan.focus}</p>
                  </div>
                )}

                {/* Missed Sleep — Daily backfill */}
                {(() => {
                  if (!sleepComeback?.lastEntry) return null;
                  const lastDate = new Date(sleepComeback.lastEntry + "T00:00:00");
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const missed: { date: string; label: string }[] = [];
                  const check = new Date(lastDate);
                  check.setDate(check.getDate() + 1);
                  while (check <= today) {
                    const dateStr = check.toISOString().split("T")[0];
                    if (!sleepEntries.find((e: any) => e.date === dateStr)) {
                      missed.push({
                        date: dateStr,
                        label: new Date(check).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" }),
                      });
                    }
                    check.setDate(check.getDate() + 1);
                  }
                  if (missed.length === 0) return null;
                  const avgSleep = sleepComeback.avgSleep || 7;
                  return (
                    <div className="mb-3 p-3 bg-black/20 rounded-xl">
                      <p className="text-xs text-indigo-300/70 mb-2 font-medium">Verpasste Nächte — schnell nachholen:</p>
                      <div className="flex gap-2 flex-wrap">
                        {missed.map(m => (
                          <button
                            key={m.date}
                            onClick={async () => {
                              try {
                                const res = await fetch("/api/sleep", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ action: "log", date: m.date, duration: avgSleep, quality: 7 }),
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setSleepEntries((prev: any[]) => [...prev, data.entry]);
                                  setSleepComeback((prev: any) => prev ? { ...prev, gapDays: 0 } : prev);
                                }
                              } catch {}
                            }}
                            className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 rounded-lg text-xs font-medium text-indigo-200 transition-all active:scale-95"
                          >
                            🌙 {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/40">
                    <span className="font-mono">Letzte: {sleepComeback.lastEntry || 'N/A'}</span>
                    {sleepComeback.lastDuration && (
                      <span className="ml-3">| {sleepComeback.lastDuration}h</span>
                    )}
                    {sleepComeback.thisMonthEntries > 0 && (
                      <span className="ml-3">| Diesen Monat: {sleepComeback.thisMonthEntries}x</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowSleepModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl font-bold text-xs transition-all active:scale-95"
                  >
                    🌙 Jetzt loggen
                  </button>
                </div>
              </div>
            )}

            {/* Mood Comeback Banner — show when gap >= 7 days */}
            {moodComeback && moodComeback.gapDays !== null && moodComeback.gapDays >= 7 && (
              <div className="p-5 rounded-2xl border bg-gradient-to-r from-yellow-500/15 to-amber-500/10 border-yellow-500/25">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-yellow-500/20 text-2xl">💭</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-yellow-300">Mood Comeback</h3>
                      <span className="text-xs text-yellow-400/60 font-mono">
                        {moodComeback.gapDays} Tage Pause
                      </span>
                    </div>
                    <p className="text-sm text-white/60 mt-0.5">{moodComeback.motivation}</p>
                  </div>
                </div>

                {moodComeback.comebackPlan && (
                  <div className="bg-black/20 rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-4 text-xs text-white/50 mb-2">
                      <span>📅 {moodComeback.comebackPlan.targetEntries} Einträge</span>
                      <span>😊 Avg: {moodComeback.avgMood || '?'}/10 Mood</span>
                      <span>⚡ Avg: {moodComeback.avgEnergy || '?'}/10 Energy</span>
                      <span>📊 {moodComeback.totalEntries} Total</span>
                    </div>
                    <p className="text-xs text-yellow-300/80 italic">{moodComeback.comebackPlan.focus}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/40">
                    <span className="font-mono">Letzte: {moodComeback.lastEntry || 'N/A'}</span>
                    {moodComeback.lastMood && (
                      <span className="ml-3">| 😊{moodComeback.lastMood}/10 ⚡{moodComeback.lastEnergy}/10</span>
                    )}
                    {moodComeback.thisMonthEntries > 0 && (
                      <span className="ml-3">| Diesen Monat: {moodComeback.thisMonthEntries}x</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowMoodModal ? setShowMoodModal(true) : setActiveTab("tracker");
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 rounded-xl font-bold text-xs transition-all active:scale-95"
                  >
                    💭 Jetzt loggen
                  </button>
                </div>
              </div>
            )}

            {/* Habits Comeback Banner — show when gap >= 7 days */}
            {habitsComeback && habitsComeback.gapDays !== null && habitsComeback.gapDays >= 7 && (
              <div className="p-5 rounded-2xl border bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border-emerald-500/25">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-2xl">✅</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-emerald-300">Habits Comeback</h3>
                      <span className="text-xs text-emerald-400/60 font-mono">
                        {habitsComeback.gapDays} Tage Pause
                      </span>
                    </div>
                    <p className="text-sm text-white/60 mt-0.5">{habitsComeback.motivation}</p>
                  </div>
                </div>

                {habitsComeback.comebackPlan && (
                  <div className="bg-black/20 rounded-xl p-3 mb-3">
                    <div className="flex items-center gap-4 text-xs text-white/50 mb-2">
                      <span>🔥 Streak: {habitsComeback.currentStreak} Tage</span>
                      <span>📊 {habitsComeback.completionRate}% Completion</span>
                      <span>📅 Avg: {habitsComeback.avgPerDay}/9 Habits</span>
                      <span>🏆 Best: {habitsComeback.longestStreak} Tage</span>
                    </div>
                    <p className="text-xs text-emerald-300/80 italic">{habitsComeback.comebackPlan.focus}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/40">
                    <span className="font-mono">Letzte: {habitsComeback.lastEntry || 'N/A'}</span>
                    {habitsComeback.todayCompleted > 0 && (
                      <span className="ml-3">| Heute: {habitsComeback.todayCompleted}/9 ✅</span>
                    )}
                    {habitsComeback.thisMonthActiveDays > 0 && (
                      <span className="ml-3">| Diesen Monat: {habitsComeback.thisMonthActiveDays} Tage</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("tracker");
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl font-bold text-xs transition-all active:scale-95"
                  >
                    ✅ Jetzt loggen
                  </button>
                </div>
              </div>
            )}

            {/* Supplements Comeback Banner — show when gap >= 2 days or not logged today */}
            {supplementsComeback && (supplementsComeback.gapDays === null || supplementsComeback.gapDays >= 2 || supplementsComeback.takenToday < supplementsComeback.total) && (
              <div className="p-5 rounded-2xl border bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border-amber-500/25">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-2xl">💊</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-amber-300">Supplements Comeback</h3>
                      <span className="text-xs text-amber-400/60 font-mono">
                        {supplementsComeback.gapDays === 0
                          ? `Heute ✅`
                          : supplementsComeback.gapDays === 1
                          ? `Gestern`
                          : supplementsComeback.gapDays != null
                          ? `${supplementsComeback.gapDays} Tage Lücke`
                          : `Keine Daten`}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 mt-0.5">{supplementsComeback.motivation}</p>
                  </div>
                </div>

                {supplementsComeback.comebackPlan && (
                  <div className="bg-black/20 rounded-xl p-3 mb-3">
                    <p className="text-xs text-amber-300/80 italic">{supplementsComeback.comebackPlan.focus}</p>
                  </div>
                )}

                {/* Per-supplement quick status */}
                {supplementsComeback.supplementStats && supplementsComeback.supplementStats.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {supplementsComeback.supplementStats.map((s: any) => (
                      <div
                        key={s.id}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border",
                          s.takenToday
                            ? "bg-green-500/20 border-green-500/30 text-green-300"
                            : s.gapDays !== null && s.gapDays >= 2
                            ? "bg-red-500/15 border-red-500/30 text-red-300"
                            : "bg-white/5 border-white/10 text-white/50"
                        )}
                      >
                        <span>{s.emoji}</span>
                        <span>{s.name}</span>
                        {s.takenToday ? <span>✅</span> : s.gapDays !== null && s.gapDays >= 2 ? <span>⏸</span> : null}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/40">
                    <span className="font-mono">
                      {supplementsComeback.takenToday}/{supplementsComeback.total} heute
                    </span>
                    {supplementsComeback.complianceRate !== undefined && supplementsComeback.complianceRate > 0 && (
                      <span className="ml-3">{supplementsComeback.complianceRate}% Letzte 7 Tage</span>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveTab("tracker")}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 rounded-xl font-bold text-xs transition-all active:scale-95"
                  >
                    💊 Supplements loggen
                  </button>
                </div>
              </div>
            )}

            {/* Gym Frequency Heatmap — 16-Week GitHub-style view */}
            <div className="p-5 bg-gradient-to-br from-white/5 to-white/3 backdrop-blur-xl rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-orange-400" />
                  <h3 className="text-sm font-bold">Gym — 16 Wochen</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block"></span> Gym</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-white/5 inline-block border border-white/10"></span> Rest</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-white/5 border border-dashed border-white/10 inline-block"></span> Zukunft</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                  {/* Day labels */}
                  <div className="flex flex-col gap-1 mr-1">
                    {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => (
                      <span key={d} className="text-[9px] text-white/25 h-4 flex items-center">{d}</span>
                    ))}
                  </div>
                  {/* Weeks columns */}
                  {gymHeatmapWeeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                      {week.map((day, di) => (
                        <div
                          key={di}
                          className={cn(
                            "w-4 h-4 rounded-sm transition-all hover:scale-125 cursor-default",
                            day.isFuture ? "bg-white/5 border border-dashed border-white/10" :
                            day.hasGym ? "bg-gradient-to-br from-orange-500 to-red-500 shadow-md shadow-orange-500/30" :
                            "bg-white/5 border border-white/5"
                          )}
                          title={day.isFuture ? "" : `${day.date}${day.hasGym ? " ✅ Gym" : ""}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {/* Month labels */}
              <div className="flex gap-1 min-w-max mt-1 pl-6">
                {gymHeatmapWeeks.map((week, wi) => {
                  const firstDay = week[0];
                  const showLabel = firstDay && (firstDay.date.slice(8) === "01" || wi === 0);
                  return showLabel ? (
                    <span key={wi} className="text-[9px] text-white/30 w-4 text-right">{firstDay.date.slice(5, 7)}/{firstDay.date.slice(2, 4)}</span>
                  ) : <span key={wi} className="w-4"></span>;
                })}
              </div>
            </div>

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
                  value: finances.funding.status === 'confirmed'
                    ? `€${(finances.funding.amount / 1000).toFixed(0)}K/mo`
                    : finances.funding.amount > 0
                    ? `Pending`
                    : "None",
                  target: finances.funding.expected
                    ? `Expected ${finances.funding.expected}`
                    : "—",
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
                  {completedCount < HABITS.length && (
                    <button
                      onClick={openRetroLog}
                      className="mt-2 text-xs text-orange-400 hover:text-orange-300 underline"
                    >
                      Lücken füllen →
                    </button>
                  )}
                </div>

                {/* Water */}
                <div className="p-3 bg-white/5 rounded-xl text-center relative">
                  <div className="text-2xl mb-1">💧</div>
                  <p className="text-sm font-bold text-cyan-400">{waterData.todayGlasses}/{waterData.dailyGoal}</p>
                  <p className="text-xs text-white/40">Water</p>
                  <div className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${Math.min(waterData.todayProgress, 100)}%` }} />
                  </div>
                  {/* Gap badge — show when 7+ days since last entry */}
                  {(waterData.daysSinceLastEntry ?? 0) >= 7 && (
                    <div className="mt-2">
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${(waterData.daysSinceLastEntry ?? 0) >= 14 ? 'bg-red-500/20 text-red-300' : 'bg-orange-500/20 text-orange-300'}`}>
                        ⏸ {waterData.daysSinceLastEntry}T Pause
                      </span>
                    </div>
                  )}
                  {/* Neustart shortcut — show when 7+ days gap AND nothing logged today */}
                  {((waterData.daysSinceLastEntry ?? 0) >= 7) && waterData.todayGlasses === 0 && (
                    <button
                      onClick={() => {
                        fetch("/api/water", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add" }) })
                          .then(r => r.json())
                          .then(() => setWaterData((prev: any) => ({ ...prev, todayGlasses: (prev.todayGlasses || 0) + 1, todayProgress: Math.round(((prev.todayGlasses || 0) + 1) / prev.dailyGoal * 100) })))
                          .catch(console.error);
                      }}
                      className="mt-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2"
                    >
                      🚀 Neustart
                    </button>
                  )}
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
                  {(() => {
                    const gymDays = [1, 3, 5]; // Mon, Wed, Fri
                    const isGymDay = gymDays.includes(dayOfWeek);
                    const doneToday = gymLogs.includes(todayStr);
                    if (doneToday) return <span className="mt-1 inline-block text-xs text-green-400">✓ Heute ✅</span>;
                    if (isGymDay) return (
                      <div className="mt-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-orange-400 animate-pulse">🎯 HEUTE GYM TAG</span>
                        <button
                          onClick={quickLogGym}
                          className="bg-green-600 hover:bg-green-500 active:bg-green-400 text-white text-xs font-bold px-3 py-1 rounded-lg transition-all w-full"
                        >
                          ✓ Quick Log
                        </button>
                      </div>
                    );
                    return <span className="mt-1 inline-block text-xs text-white/30">Offen</span>;
                  })()}
                  {gymStats && (
                    <p className={`mt-1 text-xs font-bold ${(gymStats.thisWeekSessions ?? 0) === 0 ? 'text-orange-400' : (gymStats.thisWeekSessions ?? 0) >= 2 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {gymStats.thisWeekSessions ?? 0}/2 Woche
                    </p>
                  )}
                  {gymGapDays !== null && gymGapDays >= 3 && (
                    <div className={`mt-1.5 text-xs font-bold px-1.5 py-0.5 rounded-md ${
                      gymGapDays >= 10 ? 'bg-red-500/25 text-red-400' :
                      gymGapDays >= 7 ? 'bg-orange-500/25 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      😴 {gymGapDays}T Ruhetag
                    </div>
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

            {/* Breathing Quick-Log — One-tap sessions from overview */}
            <div className="p-5 bg-gradient-to-br from-cyan-500/8 to-blue-500/8 backdrop-blur-xl rounded-2xl border border-cyan-500/15">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-cyan-500/20 rounded-xl">
                    <Wind className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-cyan-300">Breathing</h3>
                    <p className="text-xs text-white/40">
                      {breathingData.stats.streak > 0
                        ? `${breathingData.stats.streak}🔥 Streak`
                        : "No streak yet"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/50">
                    {breathingData.stats.todayCount > 0
                      ? `${breathingData.stats.todayCount} session${breathingData.stats.todayCount > 1 ? 's' : ''} today`
                      : "Keine heute"}
                  </p>
                  {breathingData.stats.avgDuration > 0 && (
                    <p className="text-xs text-white/30">Ø {breathingData.stats.avgDuration}s/session</p>
                  )}
                </div>
              </div>

              {/* Quick-log presets */}
              <div className="flex gap-2">
                {[
                  { label: "3 min", sec: 180 },
                  { label: "5 min", sec: 300 },
                  { label: "10 min", sec: 600 },
                ].map(({ label, sec }) => (
                  <button
                    key={label}
                    onClick={async () => {
                      await fetch("/api/breathing", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "log", duration: sec, rounds: 1, pattern: "box" })
                      });
                      const res = await fetch("/api/breathing");
                      if (res.ok) setBreathingData(await res.json());
                    }}
                    className="flex-1 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 active:bg-cyan-500/40 border border-cyan-500/25 rounded-xl text-xs font-bold text-cyan-300 transition-all active:scale-95"
                  >
                    🫁 {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Weekly Summary — 7-Day Overview */}
            <div className="p-6 bg-gradient-to-br from-white/5 to-white/3 backdrop-blur-xl rounded-3xl border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold">Wochenüberblick</h3>
                {weekSummaryError && <span className="text-xs text-red-400 ml-auto">Fehler</span>}
              </div>
              <div className="space-y-2">
                {weekSummaryData ? weekSummaryData.days.map((day: any) => {
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
                  const barColor = day.habits.pct >= 75 ? "text-green-400" : day.habits.pct >= 50 ? "text-yellow-400" : "text-white/30";
                  return (
                    <div key={day.date} className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
                      <span className="text-xs text-white/40 w-8">{day.dayName}</span>
                      <span className={`text-xs font-mono w-10 ${barColor}`}>{bar}</span>
                      <span className="text-xs text-white/60 flex-1">{items.length > 0 ? items.join(" ") : "—"}</span>
                      {day.gym && <span className="text-xs">🔥{weekSummaryData.streaks?.gym || 0}</span>}
                    </div>
                  );
                }) : !weekSummaryError && (
                  <p className="text-xs text-white/30">Laden...</p>
                )}
                {weekSummaryData && weekSummaryData.streaks?.gym > 0 && (
                  <div className="mt-2 flex gap-2">
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">💪 {weekSummaryData.streaks.gym}-day gym streak</span>
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Trends — 7-Day Sparkline */}
            {(() => {
              const days = weekSummaryData?.days || [];
              const pcts = days.map((d: any) => d.habits?.pct || 0);
              const maxPct = Math.max(...pcts, 1);
              const gymCount = days.filter((d: any) => d.gym).length;
              const sleepEntries = days.filter((d: any) => d.sleep).map((d: any) => d.sleep.hours);
              const sleepAvg = sleepEntries.length > 0 ? (sleepEntries.reduce((a: number, b: number) => a + b, 0) / sleepEntries.length).toFixed(1) : null;
              const avgPct = pcts.length > 0 ? Math.round(pcts.reduce((a: number, b: number) => a + b, 0) / pcts.length) : 0;
              return (
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
                  <p className="text-xs text-white/30">Ø {avgPct}%</p>
                </div>
                <div className="flex items-end gap-1 h-10">
                  {days.length === 0 ? (
                    <div className="text-xs text-white/20">Keine Daten</div>
                  ) : pcts.map((pct: number, i: number) => {
                    const height = Math.max(4, Math.round((pct / maxPct) * 40));
                    const color = pct >= 75 ? "bg-green-400" : pct >= 50 ? "bg-yellow-400" : "bg-white/20";
                    return (
                      <div key={i} className={`flex-1 ${color} rounded-sm transition-all`} style={{ height: `${height}px` }} title={`${pct}%`} />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1">
                  {days.map((d: any, i: number) => (
                    <span key={i} className="text-[9px] text-white/25">{d.dayName}</span>
                  ))}
                </div>
              </div>
              {/* Gym + Sleep row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/5 rounded-xl">
                  <p className="text-xs text-white/40 mb-1">💪 Gym-Sessions</p>
                  <p className="text-lg font-bold text-orange-400">{gymCount}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">diese Woche</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <p className="text-xs text-white/40 mb-1">🌙 Ø Schlaf</p>
                  <p className="text-lg font-bold text-indigo-400">{sleepAvg ? `${sleepAvg}h` : "—"}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">Std/ Nacht</p>
                </div>
              </div>
            </div>
              );
            })()}

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
                      <span className="text-amber-400">Antwort: {finances.funding?.expected ?? 'May/June 2026'}</span>
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

                {/* Weekly Frequency Sparkline */}
                {gymStats && gymStats.last8Weeks && gymStats.last8Weeks.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-white/40">📊 Frequenz (letzte Wochen)</p>
                      <div className="flex gap-3 text-xs text-white/40">
                        <span>Dieses Woche: <span className="text-orange-400 font-bold">{gymStats.thisWeekSessions}x</span></span>
                        <span>Ø alle <span className="text-orange-400 font-bold">{gymStats.avgGapDays}</span> Tage</span>
                        <span>Dieser Monat: <span className="text-orange-400 font-bold">{gymStats.monthlyThis}x</span></span>
                      </div>
                    </div>
                    <div className="flex items-end gap-1 h-10">
                      {gymStats.last8Weeks.slice().reverse().map((w: any, i: number) => {
                        const maxCount = Math.max(...gymStats.last8Weeks.map((x: any) => x.count), 1);
                        const height = Math.max(4, Math.round((w.count / maxCount) * 40));
                        const label = w.week.split('-W')[1];
                        return (
                          <div key={i} className="flex-1 group relative flex flex-col items-center">
                            <div
                              className="w-full bg-orange-500/60 hover:bg-orange-400 rounded-sm transition-all cursor-default"
                              style={{ height: `${height}px` }}
                              title={`${w.week}: ${w.count}x`}
                            />
                            <span className="text-[9px] text-white/30 mt-1">W{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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

          {/* Breathing Exercise */}
          <div className="mt-6 p-5 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-2xl border border-teal-500/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🌬️</span>
              <h3 className="font-bold">Breathing Exercise</h3>
              <span className="ml-auto text-xs text-white/40">{breathingData.stats.streak}🔥 streak</span>
            </div>

            {/* Pattern Selector */}
            <div className="flex gap-2 flex-wrap mb-4">
              {Object.entries(BREATHING_PATTERNS).map(([key, pat]) => (
                <button
                  key={key}
                  onClick={() => { if (!breathingActive) setBreathingPattern(key); }}
                  disabled={breathingActive}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    breathingPattern === key
                      ? "bg-teal-500/30 border-teal-500/50 text-teal-300"
                      : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
                  )}
                >
                  {pat.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-white/40 mb-4">{BREATHING_PATTERNS[breathingPattern]?.desc}</p>

            {/* Breathing Circle Animation */}
            <div className="flex justify-center mb-4">
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Outer ring */}
                <div className={cn(
                  "absolute inset-0 rounded-full border-2 transition-all duration-1000",
                  breathingPhase === "idle" ? "border-white/10" :
                  breathingPhase === "inhale" ? "border-cyan-400 scale-110" :
                  breathingPhase === "hold" ? "border-cyan-400/70 scale-110" :
                  breathingPhase === "exhale" ? "border-teal-400 scale-90" :
                  "border-teal-400/50 scale-90"
                )} />
                {/* Inner circle */}
                <div className={cn(
                  "w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/40 to-teal-500/40 backdrop-blur-sm flex items-center justify-center transition-all duration-1000",
                  breathingPhase === "idle" ? "scale-100" :
                  breathingPhase === "inhale" ? "scale-125" :
                  breathingPhase === "hold" ? "scale-125" : "scale-75"
                )}>
                  <span className="text-sm font-bold text-white/80">
                    {breathingPhase === "idle" ? "▶" :
                     breathingPhase === "inhale" ? "IN" :
                     breathingPhase === "hold" ? "HOLD" : "OUT"}
                  </span>
                </div>
              </div>
            </div>

            {/* Timer + Round Counter */}
            <div className="flex justify-center gap-6 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-400">{Math.floor(breathingSeconds / 60)}:{(breathingSeconds % 60).toString().padStart(2, "0")}</p>
                <p className="text-xs text-white/40">Duration</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-teal-400">{breathingRounds}</p>
                <p className="text-xs text-white/40">Rounds</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              {!breathingActive ? (
                <button
                  onClick={() => {
                    setBreathingActive(true);
                    setBreathingSeconds(0);
                    setBreathingRounds(0);
                    setBreathingPhase("inhale");
                    let elapsed = 0;
                    let rounds = 0;
                    const pat = BREATHING_PATTERNS[breathingPattern];
                    const cycleSec = (pat.inhale + pat.hold + pat.exhale + (pat.hold2 || 0));
                    const tick = () => {
                      elapsed++;
                      setBreathingSeconds(elapsed);
                      const pos = elapsed % cycleSec;
                      let phase = "idle";
                      if (pos < pat.inhale) phase = "inhale";
                      else if (pos < pat.inhale + pat.hold) phase = "hold";
                      else if (pos < pat.inhale + pat.hold + pat.exhale) phase = "exhale";
                      else if (pat.hold2 && pos < pat.inhale + pat.hold + pat.exhale + pat.hold2) phase = "hold2";
                      if (elapsed > 0 && elapsed % cycleSec === 0) { rounds++; setBreathingRounds(rounds); }
                      setBreathingPhase(phase);
                    };
                    const interval = setInterval(tick, 1000);
                    (window as any).__breathingInterval = interval;
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 rounded-xl font-bold text-white text-sm transition-all"
                >
                  ▶ Start {BREATHING_PATTERNS[breathingPattern]?.label}
                </button>
              ) : (
                <button
                  onClick={() => {
                    clearInterval((window as any).__breathingInterval);
                    setBreathingActive(false);
                    setBreathingPhase("idle");
                    if (breathingSeconds > 10) logBreathingSession(breathingSeconds, breathingRounds);
                    setBreathingSeconds(0);
                    setBreathingRounds(0);
                  }}
                  className="flex-1 py-2.5 bg-red-500/30 hover:bg-red-500/50 border border-red-500/40 rounded-xl font-bold text-red-300 text-sm transition-all"
                >
                  ■ Stop & Log
                </button>
              )}
            </div>

            {/* Stats row */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-white/5 rounded-xl">
                <p className="text-lg font-bold text-cyan-400">{breathingData.stats.totalSessions}</p>
                <p className="text-xs text-white/40">Total Sessions</p>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-xl">
                <p className="text-lg font-bold text-teal-400">{breathingData.stats.totalMinutes}m</p>
                <p className="text-xs text-white/40">Total Minutes</p>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-xl">
                <p className="text-lg font-bold text-white/60">{breathingData.stats.todayCount}</p>
                <p className="text-xs text-white/40">Today</p>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Water Tracker */}]
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

        {/* Supplements Tracker */}
        {activeTab === "tracker" && (
          <div className="p-8 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl rounded-3xl border border-amber-500/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <span className="text-2xl">💊</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Supplements</h2>
                  <p className="text-xs text-white/40">Creatin · Vitamin D · Omega-3 · Magnesium</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-amber-400">{supplementsData.takenToday}/{supplementsData.total}</p>
                <p className="text-xs text-white/50">taken today</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                style={{ width: `${supplementsData.total > 0 ? (supplementsData.takenToday / supplementsData.total) * 100 : 0}%` }}
              />
            </div>

            {/* Supplement Pills Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {supplementsData.supplements.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => toggleSupplement(s.id)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98]",
                    s.taken
                      ? "bg-green-500/20 border-green-500/30"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="text-2xl mb-1">{s.emoji}</div>
                  <div className="text-sm font-medium text-white/80 truncate">{s.name}</div>
                  <div className="text-xs text-white/40 mt-0.5">{s.dose}</div>
                  <div className="mt-2 flex items-center justify-between">
                    {s.taken ? (
                      <span className="text-green-400 text-xs">✓</span>
                    ) : (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                    {s.streak > 0 && (
                      <span className="text-xs text-orange-400">🔥{s.streak}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Log All — shown when not all taken */}
            {supplementsData.takenToday < supplementsData.total && supplementsData.total > 0 && (
              <button
                onClick={logAllSupplements}
                className="w-full mb-4 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-xl text-amber-300 text-sm font-medium transition-all"
              >
                💊 Alle {supplementsData.total - supplementsData.takenToday} fehlenden jetzt loggen
              </button>
            )}

            {/* Last 7 days mini bar */}
            {supplementsData.supplements.length > 0 && (
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-xs text-white/40 mb-3">Letzte 7 Tage — consistency</p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {supplementsData.supplements.map((s: any) => (
                    <div key={s.id} className="flex-shrink-0 w-20 p-2 bg-white/5 rounded-xl text-center">
                      <div className="text-lg mb-0.5">{s.emoji}</div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${Math.round((s.last7Days / 7) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-white/40 mt-1">{s.last7Days}/7</p>
                    </div>
                  ))}
                </div>
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
        {/* Retro-Log — Backfill missed days */}
        <div className="p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-xl rounded-3xl border border-cyan-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-xl">
                <Calendar className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Retro-Log</h2>
                <p className="text-xs text-white/40"> vergessene Tage nachholen</p>
              </div>
            </div>
            <button
              onClick={openRetroLog}
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-xl text-cyan-300 text-sm font-medium transition-all"
            >
              + Tag wählen
            </button>
          </div>
          <p className="text-xs text-white/40">
            Datenlücke entdeckt? Trag vergangene Tage hier nach — Habits, Sleep, Gym oder Mood.
          </p>
        </div>

        {/* Pushup Challenge */}
        <div className="p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-xl">
                <Zap className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Liegestütze Challenge</h2>
                <p className="text-xs text-white/40 mt-0.5">One punch man style — day N = N reps</p>
              </div>
            </div>
            {pushupData.currentStreak > 0 && (
              <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium">
                🔥 {pushupData.currentStreak}-day streak
              </span>
            )}
          </div>

          {/* Current Day Hero */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="p-4 bg-gradient-to-br from-orange-500/20 to-red-500/10 rounded-2xl border border-orange-500/20 text-center">
              <p className="text-3xl font-bold text-orange-400">Tag {pushupData.currentDay}</p>
              <p className="text-xs text-white/40 mt-1">Current Day</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
              <p className="text-3xl font-bold text-white">{pushupData.todayReps ?? pushupData.currentDay}</p>
              <p className="text-xs text-white/40 mt-1">Reps Today</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
              <p className="text-3xl font-bold text-white">{pushupData.totalReps.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-1">Total Reps</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
              <p className="text-3xl font-bold text-amber-400">{pushupData.maxReps}</p>
              <p className="text-xs text-white/40 mt-1">Max Reps</p>
            </div>
          </div>

          {/* Quick Log */}
          <div className="flex items-center gap-3 mb-4">
            <input
              type="number"
              value={pushupInput}
              onChange={(e) => setPushupInput(e.target.value)}
              placeholder={`${pushupData.currentDay} (Tag ${pushupData.currentDay})`}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-orange-500/40"
              min="1"
              onKeyDown={(e) => e.key === "Enter" && logPushups(Number(pushupInput))}
            />
            <button
              onClick={() => logPushups(Number(pushupInput))}
              disabled={!pushupInput}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-all"
            >
              {pushupData.todayCompleted ? "Aktualisieren" : "Log ✓"}
            </button>
          </div>

          {/* Progression Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-white/40 mb-1">
              <span>Tag {Math.max(1, pushupData.currentDay - 6)}</span>
              <span>Tag {pushupData.currentDay}</span>
            </div>
            <div className="h-8 bg-white/5 rounded-xl overflow-hidden flex divide-x divide-white/10">
              {(pushupData.last30 || []).slice(-7).map((entry: any, i: number) => {
                const pct = Math.min(100, Math.round((entry.reps / (entry.day || 1)) * 100));
                const color = entry.reps >= entry.day ? "bg-green-500" : entry.reps >= entry.day * 0.7 ? "bg-yellow-400" : "bg-red-400";
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end" title={`Tag ${entry.day}: ${entry.reps} Reps`}>
                    <div className={color + " opacity-80 transition-all"} style={{ height: `${pct}%` }} />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-white/30 mt-1 text-center">Letzte 7 Tage — grün = Tag geschafft</p>
          </div>
        </div>

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
                  placeholder="Betrag (€)"
                  value={txAmount}
                  onChange={e => setTxAmount(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-bold placeholder-white/30 focus:outline-none focus:border-indigo-500/50"
                />
                <select
                  value={txType}
                  onChange={e => setTxType(e.target.value as "income" | "expense")}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70 focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="expense">− Expense</option>
                  <option value="income">+ Income</option>
                </select>
                <select
                  value={txCategory}
                  onChange={e => setTxCategory(e.target.value)}
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
              <div className="flex gap-3 mt-3">
                <input
                  type="date"
                  value={txDate}
                  onChange={e => setTxDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/50 [color-scheme:dark]"
                />
                <input
                  type="text"
                  placeholder="Beschreibung (optional)"
                  value={txDescription}
                  onChange={e => setTxDescription(e.target.value)}
                  className="flex-[2] px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
              <button
                onClick={async () => {
                  const amount = parseFloat(txAmount);
                  if (isNaN(amount) || amount <= 0) return;
                  
                  const res = await fetch("/api/finance", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "addTransaction",
                      type: txType,
                      category: txCategory,
                      amount,
                      description: txDescription,
                      date: txDate
                    }),
                  });
                  
                  if (res.ok) {
                    const data = await res.json();
                    setFinances(data.data);
                    setTxAmount("");
                    setTxDescription("");
                    setTxDate(new Date().toISOString().split('T')[0]);
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

            {/* FI Roadmap — API-driven with fallbacks */}
            <div className="p-8 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10 backdrop-blur-xl rounded-3xl border border-amber-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500/20 rounded-xl">
                  <Target className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold">FI Roadmap</h3>
                {roadmapData && (
                  <span className="ml-auto text-xs text-green-400 font-medium">✓ API loaded</span>
                )}
              </div>

              {/* Current Stats — from API or fallback */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-4 bg-white/5 rounded-xl text-center border border-white/10">
                  <p className="text-xs text-white/40 mb-1">Net Worth</p>
                  <p className="text-lg font-bold text-amber-400">
                    €{((roadmapData?.current?.netWorth) || (finances.savings + finances.crypto)).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl text-center border border-white/10">
                  <p className="text-xs text-white/40 mb-1">Monthly Burn</p>
                  <p className="text-lg font-bold text-red-400">
                    €{(roadmapData?.current?.monthlyCosts || finances.monthlyCosts).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl text-center border border-white/10">
                  <p className="text-xs text-white/40 mb-1">FI Number (4%)</p>
                  <p className="text-lg font-bold text-green-400">
                    €{((roadmapData?.current?.monthlyCosts || finances.monthlyCosts) * 12 * 25).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* API-driven Milestones (if loaded) */}
              {roadmapData?.milestones && roadmapData.milestones.length > 0 && (
                <>
                  <p className="text-sm text-white/50 mb-3">Milestones</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {roadmapData.milestones.map((milestone: any, idx: number) => {
                      const colors = ["from-green-500", "from-blue-500", "from-purple-500", "from-amber-500"];
                      const textColors = ["text-green-400", "text-blue-400", "text-purple-400", "text-amber-400"];
                      return (
                        <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10">
                          <div className={`inline-flex p-1.5 bg-gradient-to-br ${colors[idx % colors.length]}/20 rounded-lg mb-2`}>
                            <Target className={`w-4 h-4 ${textColors[idx % textColors.length]}`} />
                          </div>
                          <p className="text-xs text-white/40 mb-1">{milestone.label}</p>
                          <p className={`text-sm font-bold ${milestone.status === "complete" ? "text-green-400" : "text-white/80"}`}>
                            {milestone.status === "complete" ? "✓ " : ""}€{(milestone.current / 1000).toFixed(0)}K
                          </p>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                            <div
                              className={`h-full rounded-full ${milestone.status === "complete" ? "bg-green-500" : "bg-gradient-to-r from-amber-500 to-orange-400"}`}
                              style={{ width: `${Math.min(milestone.pct, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-white/30 mt-1">{milestone.pct}%</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Net Worth Projection Chart (if API loaded) */}
              {roadmapData?.projectionLine && roadmapData.projectionLine.length > 0 && (
                <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-medium text-white/70">Net Worth Projection (12 months)</p>
                    {roadmapData.monthsTo50K !== null && (
                      <span className="text-xs text-green-400">
                        {roadmapData.monthsTo50K} months to €50K
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-1 h-20">
                    {roadmapData.projectionLine.map((point: any, idx: number) => {
                      const values = roadmapData.projectionLine.map((p: any) => p.netWorth);
                      const minV = Math.min(...values);
                      const maxV = Math.max(...values);
                      const range = maxV - minV || 1;
                      const height = ((point.netWorth - minV) / range) * 100;
                      return (
                        <div key={idx} className="flex-1 group relative">
                          <div
                            className={`rounded-t transition-all ${point.milestone ? "bg-green-500/80" : "bg-amber-500/60 hover:bg-amber-400"}`}
                            style={{ height: `${Math.max(height, 5)}%` }}
                          />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 text-xs text-white/40 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded mb-1">
                            {point.month}: €{(point.netWorth / 1000).toFixed(1)}K
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {roadmapData.summary && (
                    <p className="text-xs text-white/40 mt-2 text-center">
                      {roadmapData.summary.message} — Sparquote: {roadmapData.current?.sparquote || 0}%
                    </p>
                  )}
                </div>
              )}

              {/* Fallback Scenarios (when API not loaded) */}
              {!roadmapData && (
                <div className="space-y-3">
                  <p className="text-sm text-white/50 mb-3">Path to Financial Independence</p>

                  {/* Scenario 1: Current path */}
                  {(() => {
                    const netWorth = finances.savings + finances.crypto;
                    const monthlyBurn = finances.monthlyCosts;
                    const fiNumber = monthlyBurn * 12 * 25;
                    const monthlyReturn = netWorth > 0 ? netWorth * 0.0058 : 0;
                    const monthlyDeficit = monthlyBurn;
                    const netMonthlyChange = monthlyReturn - monthlyDeficit;
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
                        <p className="text-xs text-white/30 mt-1">{((netWorth / fiNumber) * 100).toFixed(1)}% to FI</p>
                      </div>
                    );
                  })()}

                  {/* Scenario 2: With €12K/mo grant */}
                  {(() => {
                    const netWorth = finances.savings + finances.crypto;
                    const monthlyBurn = finances.monthlyCosts;
                    const grant = 12000;
                    const fiNumber = monthlyBurn * 12 * 25;
                    const monthlySurplus = grant - monthlyBurn;
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
                          <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" style={{ width: `${Math.min(100, (netWorth / fiNumber) * 100)}%` }} />
                        </div>
                        <p className="text-xs text-white/30 mt-1">
                          {monthsToFI < 999 ? `FI by ${fiDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}` : 'FI number too high'}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Scenario 3: Lean FI */}
                  {(() => {
                    const netWorth = finances.savings + finances.crypto;
                    const leanFI = 300000;
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
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              <p className="text-xs text-white/20 mt-4 text-center">
                FI Number = 25× annual expenses (4% rule) • Assumes grant starts June 2026
              </p>
            </div>

            {/* Net Worth Journey — full chart with milestones */}
            {networthHistory && networthHistory.history && networthHistory.history.length > 0 && (
              <div className="p-8 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-cyan-500/10 backdrop-blur-xl rounded-3xl border border-violet-500/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-violet-500/20 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Net Worth Journey</h3>
                    <p className="text-xs text-white/40">History + Projection · Ziel: €{networthHistory.target.toLocaleString()}</p>
                  </div>
                  {networthHistory.monthsTo50K !== null && (
                    <span className="ml-auto px-3 py-1 bg-violet-500/20 text-violet-400 rounded-full text-xs font-bold">
                      {networthHistory.monthsTo50K} Mo. bis €50K
                    </span>
                  )}
                </div>

                {/* Header stats row */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="p-3 bg-white/5 rounded-xl text-center border border-white/10">
                    <p className="text-xs text-white/40 mb-1">Aktuell</p>
                    <p className="text-base font-bold text-violet-400">€{(networthHistory.current.netWorth / 1000).toFixed(1)}K</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl text-center border border-white/10">
                    <p className="text-xs text-white/40 mb-1">Sparrate</p>
                    <p className="text-base font-bold text-green-400">€{networthHistory.current.monthlySavingsRate}/mo</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl text-center border border-white/10">
                    <p className="text-xs text-white/40 mb-1">Sparquote</p>
                    <p className="text-base font-bold text-cyan-400">{networthHistory.current.sparquote}%</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl text-center border border-white/10">
                    <p className="text-xs text-white/40 mb-1">€50K in</p>
                    <p className="text-base font-bold text-amber-400">
                      {networthHistory.monthsTo50K !== null ? `${networthHistory.monthsTo50K} Mo.` : '—'}
                    </p>
                  </div>
                </div>

                {/* Milestone timeline */}
                <div className="mb-6">
                  <p className="text-sm text-white/50 mb-3">Meilensteine</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {networthHistory.milestones.map((m: any, idx: number) => {
                      const colors = ["green", "blue", "purple", "amber"];
                      const bgColors = ["bg-green-500", "bg-blue-500", "bg-purple-500", "bg-amber-500"];
                      const textColors = ["text-green-400", "text-blue-400", "text-purple-400", "text-amber-400"];
                      const borderColors = ["border-green-500/30", "border-blue-500/30", "border-purple-500/30", "border-amber-500/30"];
                      const c = colors[idx];
                      return (
                        <div key={idx} className={`p-3 rounded-xl border ${borderColors[idx % 4]} bg-white/5`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-white/40">{m.label}</p>
                            {m.reached && <span className="text-green-400 text-xs">✓</span>}
                          </div>
                          <p className={`text-sm font-bold ${m.reached ? "text-green-400" : textColors[idx % 4]}`}>
                            {m.reached ? "✓ " : ""}€{(m.target / 1000).toLocaleString()}K
                          </p>
                          {m.projectedMonth && !m.reached && (
                            <p className="text-xs text-white/30 mt-0.5">
                              ~{m.projectedMonth}
                            </p>
                          )}
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                            <div
                              className={`h-full ${m.reached ? "bg-green-500" : `bg-gradient-to-r ${c === "green" ? "from-green-500 to-emerald-400" : c === "blue" ? "from-blue-500 to-cyan-400" : c === "purple" ? "from-purple-500 to-pink-400" : "from-amber-500 to-orange-400"}`} rounded-full`}
                              style={{ width: `${Math.min(100, Math.round((networthHistory.current.netWorth / m.target) * 100))}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Full bar chart */}
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-medium text-white/70">Net Worth Verlauf</p>
                    <div className="flex gap-3 text-xs text-white/40">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-violet-400 inline-block"></span> Historisch</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-400/60 inline-block"></span> Projektion</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-400 inline-block"></span> Grant</span>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="relative">
                    {/* Y-axis labels */}
                    <div className="flex text-xs text-white/30 mb-1">
                      <div className="w-10" /> {/* spacer */}
                      <div className="flex-1 flex justify-between pr-2">
                        {[0, 25, 50, 75, 100].map(pct => {
                          const val = Math.round((pct / 100) * networthHistory.target);
                          return <span key={pct}>€{(val / 1000).toFixed(0)}K</span>;
                        })}
                      </div>
                    </div>

                    {/* Bars */}
                    <div className="flex items-end gap-0.5 h-32 relative">
                      {/* Target line */}
                      <div className="absolute top-0 left-0 right-0 h-px bg-amber-500/30" style={{ top: "0%" }} />
                      <div className="absolute" style={{ top: "0%", left: "0", fontSize: "8px", color: "#f59e0b", transform: "translateY(-4px)" }}>€50K</div>

                      {networthHistory.history.map((point: any, idx: number) => {
                        const allVals = networthHistory.history.map((p: any) => p.netWorth);
                        const maxV = Math.max(...allVals, networthHistory.target);
                        const heightPct = (point.netWorth / maxV) * 100;
                        const isGrant = point.isPostFunding;
                        const isToday = !point.isProjection;
                        return (
                          <div key={idx} className="flex-1 group relative">
                            <div
                              className={`rounded-t transition-all w-full cursor-default ${isGrant ? "bg-green-500/80" : isToday ? "bg-gradient-to-t from-violet-500 to-indigo-400" : "bg-indigo-400/40 hover:bg-indigo-400/60"}`}
                              style={{ height: `${Math.max(heightPct, 2)}%`, minHeight: "2px" }}
                            />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/90 text-white px-1.5 py-0.5 rounded mb-1 z-10 text-center">
                              <div className="font-bold">€{(point.netWorth / 1000).toFixed(1)}K</div>
                              <div className="text-white/60 text-[9px]">{point.label}</div>
                              {point.isProjection && <div className="text-indigo-400 text-[9px]">⏱ Proj.</div>}
                              {point.isPostFunding && <div className="text-green-400 text-[9px]">🎉 Grant!</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* X-axis labels */}
                    <div className="flex gap-0.5 mt-1">
                      <div className="w-10" /> {/* spacer */}
                      <div className="flex-1 flex justify-between">
                        {(() => {
                          const pts = networthHistory.history;
                          if (pts.length <= 8) return pts.map((p: any) => <span key={p.month} className="text-[9px] text-white/30">{p.label}</span>);
                          // Show every Nth label
                          const step = Math.ceil(pts.length / 8);
                          return pts.map((p: any, i: number) =>
                            i % step === 0 ? <span key={p.month} className="text-[9px] text-white/30">{p.label}</span> : <span key={p.month} />
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Snapshot Button */}
            <div className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-cyan-500/20 rounded-xl">
                  <Activity className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Net Worth Snapshot</h3>
                  <p className="text-xs text-white/40">Aktuellen Stand speichern</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const res = await fetch("/api/finance/networth-history", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({}),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setNetworthHistory((prev: any) => prev ? { ...prev, history: data.history } : null);
                  }
                }}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl font-bold text-sm text-white transition-all"
              >
                📊 Jetzt snapshotten
              </button>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === "trends" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">30-Day Trends</h2>
                <p className="text-white/40 text-sm">Week-over-week comparison</p>
              </div>
              {trendsData && (
                <div className="text-xs text-white/30">
                  Updated {new Date(trendsData.generatedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            {!trendsData ? (
              <div className="text-center py-20 text-white/40">Loading trends...</div>
            ) : (
              <>
                {/* KPI Cards */}
                {/* Wellness Score — hero card */}
                <div className="md:col-span-3 p-5 bg-gradient-to-br from-green-500/15 to-emerald-500/10 backdrop-blur-xl rounded-2xl border border-green-500/25">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-white/50 text-xs">Today's Wellness Score</span>
                      <p className="text-5xl font-bold text-green-400">{wellnessScore ?? '—'}<span className="text-2xl text-white/40">/100</span></p>
                    </div>
                    <div className="relative w-20 h-20">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="none" className="text-white/10" />
                        <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="none" strokeDasharray={`${2 * Math.PI * 34}`} strokeDashoffset={`${2 * Math.PI * 34 * (1 - (wellnessScore ?? 0) / 100)}`} className="text-green-400 transition-all duration-700" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold">{wellnessScore ?? '?'}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-white/50">Composite: habits (30%) + gym (20%) + sleep (25%) + mood (15%) + water (10%)</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Gym */}
                  <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/50 text-xs">Gym Days</span>
                      <Dumbbell className="w-4 h-4 text-orange-400" />
                    </div>
                    <p className="text-2xl font-bold">{trendsData.trends.gym.value}<span className="text-sm text-white/40">/7d</span></p>
                    <p className={cn("text-xs font-medium mt-1", trendsData.trends.gym.change >= 0 ? "text-green-400" : "text-red-400")}>
                      {trendsData.trends.gym.change >= 0 ? "+" : ""}{trendsData.trends.gym.change}% vs prev week
                    </p>
                  </div>

                  {/* Gym Monthly Adherence — Mon/Wed/Fri schedule */}
                  {(() => {
                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();
                    const scheduledDays: string[] = [];
                    const d = new Date(currentYear, currentMonth, 1);
                    while (d.getMonth() === currentMonth) {
                      const dow = d.getDay();
                      if (dow === 1 || dow === 3 || dow === 5) {
                        scheduledDays.push(d.toISOString().split('T')[0]);
                      }
                      d.setDate(d.getDate() + 1);
                    }
                    const completedThisMonth = trendsData.days.filter((day: any) =>
                      day.gym && day.date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)
                    ).length;
                    const scheduledThisMonth = scheduledDays.filter(s => s <= todayStr).length;
                    const adherencePct = scheduledThisMonth > 0 ? Math.round((completedThisMonth / scheduledThisMonth) * 100) : 0;
                    const adhColor = adherencePct === 0 ? 'text-red-400' : adherencePct < 50 ? 'text-orange-400' : adherencePct < 75 ? 'text-yellow-400' : 'text-green-400';
                    return (
                      <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/50 text-xs">Mon/Wed/Fri</span>
                          <Target className="w-4 h-4 text-purple-400" />
                        </div>
                        <p className="text-2xl font-bold">{completedThisMonth}<span className="text-sm text-white/40">/{scheduledThisMonth}</span></p>
                        <p className={cn("text-xs font-medium mt-1", adhColor)}>
                          {adherencePct}% adherence
                        </p>
                      </div>
                    );
                  })()}

                  {/* Habits */}
                  <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/50 text-xs">Avg Habits</span>
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold">{trendsData.trends.habits.value}<span className="text-sm text-white/40">%</span></p>
                    <p className={cn("text-xs font-medium mt-1", trendsData.trends.habits.change >= 0 ? "text-green-400" : "text-red-400")}>
                      {trendsData.trends.habits.change >= 0 ? "+" : ""}{trendsData.trends.habits.change}% vs prev week
                    </p>
                  </div>

                  {/* Mood */}
                  <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/50 text-xs">Avg Mood</span>
                      <Star className="w-4 h-4 text-yellow-400" />
                    </div>
                    <p className="text-2xl font-bold">{trendsData.trends.mood.value || "—"}<span className="text-sm text-white/40">/10</span></p>
                    <p className={cn("text-xs font-medium mt-1", (trendsData.trends.mood.change || 0) >= 0 ? "text-green-400" : "text-red-400")}>
                      {(trendsData.trends.mood.change || 0) >= 0 ? "+" : ""}{trendsData.trends.mood.change || 0}% vs prev week
                    </p>
                  </div>

                  {/* Sleep */}
                  <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/50 text-xs">Avg Sleep</span>
                      <Moon className="w-4 h-4 text-indigo-400" />
                    </div>
                    <p className="text-2xl font-bold">{trendsData.trends.sleep.value || "—"}<span className="text-sm text-white/40">h</span></p>
                    <p className={cn("text-xs font-medium mt-1", (trendsData.trends.sleep.change || 0) >= 0 ? "text-green-400" : "text-red-400")}>
                      {(trendsData.trends.sleep.change || 0) >= 0 ? "+" : ""}{trendsData.trends.sleep.change || 0}% vs prev week
                    </p>
                  </div>

                  {/* Calories */}
                  <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/50 text-xs">Calories</span>
                      <Flame className="w-4 h-4 text-red-400" />
                    </div>
                    <p className="text-2xl font-bold">{trendsData.trends.calories.value?.toLocaleString() || 0}</p>
                    <p className={cn("text-xs font-medium mt-1", trendsData.trends.calories.change >= 0 ? "text-green-400" : "text-red-400")}>
                      {trendsData.trends.calories.change >= 0 ? "+" : ""}{trendsData.trends.calories.change}% vs prev week
                    </p>
                  </div>

                  {/* Water */}
                  <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/50 text-xs">Water</span>
                      <Droplets className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold">{trendsData.trends.water.value || 0}<span className="text-sm text-white/40">gl/d</span></p>
                    <p className={cn("text-xs font-medium mt-1", (trendsData.trends.water?.change || 0) >= 0 ? "text-green-400" : "text-red-400")}>
                      {(trendsData.trends.water?.change || 0) >= 0 ? "+" : ""}{trendsData.trends.water?.change || 0}% vs prev week
                    </p>
                  </div>

                  {/* Breathing */}
                  <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/50 text-xs">Breathing</span>
                      <Wind className="w-4 h-4 text-cyan-400" />
                    </div>
                    <p className="text-2xl font-bold">{trendsData.trends.breathing.value || 0}<span className="text-sm text-white/40">min/d</span></p>
                    <p className={cn("text-xs font-medium mt-1", (trendsData.trends.breathing?.change || 0) >= 0 ? "text-green-400" : "text-red-400")}>
                      {(trendsData.trends.breathing?.change || 0) >= 0 ? "+" : ""}{trendsData.trends.breathing?.change || 0}% vs prev week
                    </p>
                  </div>

                  {/* Weight */}
                  <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/50 text-xs">Weight</span>
                      <Activity className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold">{trendsData.trends.weight.value || "—"}<span className="text-sm text-white/40">kg</span></p>
                    <p className={cn("text-xs font-medium mt-1", (trendsData.trends.weight.change || 0) <= 0 ? "text-green-400" : "text-red-400")}>
                      {trendsData.trends.weight.change !== null ? `${trendsData.trends.weight.change > 0 ? "+" : ""}${trendsData.trends.weight.change}kg vs prev week` : "No data"}
                    </p>
                  </div>

                  {/* Protein */}
                  <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/50 text-xs">Protein</span>
                      <Flame className="w-4 h-4 text-red-400" />
                    </div>
                    <p className="text-2xl font-bold">{trendsData.trends.protein.value || 0}<span className="text-sm text-white/40">g/d</span></p>
                    <p className={cn("text-xs font-medium mt-1", (trendsData.trends.protein?.change || 0) >= 0 ? "text-green-400" : "text-red-400")}>
                      {(trendsData.trends.protein?.change || 0) >= 0 ? "+" : ""}{trendsData.trends.protein?.change || 0}% vs prev week
                    </p>
                  </div>

                  {/* Energy */}
                  <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/50 text-xs">Energy</span>
                      <Zap className="w-4 h-4 text-yellow-400" />
                    </div>
                    <p className="text-2xl font-bold">{trendsData.trends.energy.value || "—"}<span className="text-sm text-white/40">/10</span></p>
                    <p className={cn("text-xs font-medium mt-1", (trendsData.trends.energy?.change || 0) >= 0 ? "text-green-400" : "text-red-400")}>
                      {(trendsData.trends.energy?.change || 0) >= 0 ? "+" : ""}{trendsData.trends.energy?.change || 0}% vs prev week
                    </p>
                  </div>

                  {/* Supplements */}
                  <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/50 text-xs">Supplements</span>
                      <Pill className="w-4 h-4 text-violet-400" />
                    </div>
                    <p className="text-2xl font-bold">
                      {supplementsData ? `${supplementsData.takenToday}/${supplementsData.total}` : "—"}
                      <span className="text-sm text-white/40">taken</span>
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-500"
                          style={{ width: `${supplementsData && supplementsData.total > 0 ? (supplementsData.takenToday / supplementsData.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/40">
                        {supplementsData && supplementsData.total > 0
                          ? `${Math.round((supplementsData.takenToday / supplementsData.total) * 100)}%`
                          : "0%"}
                      </span>
                    </div>
                    {/* 7-Day Consistency Grid */}
                    {supplementsData && supplementsData.supplements.length > 0 && (() => {
                      const allLast7 = supplementsData.supplements.map((s: any) => s.last7Days || 0);
                      const avgLast7 = allLast7.reduce((a: number, b: number) => a + b, 0) / allLast7.length;
                      const bestStreak = Math.max(...supplementsData.supplements.map((s: any) => s.streak || 0));
                      const dots = Array.from({ length: 7 }, (_, i) => ({
                        filled: avgLast7 >= (6 - i),
                        label: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][i]
                      }));
                      return (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-white/30">7-Tage Konsistenz</span>
                            {bestStreak > 0 && (
                              <span className="text-[10px] text-orange-400">🔥 {bestStreak}d Streak</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {dots.map((d, i) => (
                              <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                                <div className={cn(
                                  "w-full h-2.5 rounded-sm transition-all",
                                  d.filled ? "bg-gradient-to-r from-violet-500 to-purple-400" : "bg-white/10"
                                )} />
                                <span className="text-[9px] text-white/30">{d.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Meditation KPI Card — show when meditation data exists */}
                {wellnessData.meditation.entries.length > 0 && (() => {
                  const entries = wellnessData.meditation.entries;
                  const today = new Date().toISOString().split('T')[0];
                  const last7 = entries.slice(0, 7);
                  const prev7 = entries.slice(7, 14);
                  const avgLast = last7.length > 0 ? Math.round(last7.reduce((s: number, e: any) => s + (e.minutes || 0), 0) / last7.length) : 0;
                  const avgPrev = prev7.length > 0 ? Math.round(prev7.reduce((s: number, e: any) => s + (e.minutes || 0), 0) / prev7.length) : 0;
                  const medTrend = avgPrev > 0 ? Math.round(((avgLast - avgPrev) / avgPrev) * 100) : (avgLast > 0 ? 100 : 0);
                  const todayEntry = entries.find((e: any) => e.date === today);
                  return (
                    <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/50 text-xs">Meditation</span>
                        <span className="text-lg">🧘</span>
                      </div>
                      <p className="text-2xl font-bold">{avgLast}<span className="text-sm text-white/40">min/d</span></p>
                      <p className={cn("text-xs font-medium mt-1", medTrend >= 0 ? "text-green-400" : "text-red-400")}>
                        {medTrend >= 0 ? "+" : ""}{medTrend}% vs prev week
                      </p>
                      {todayEntry && (
                        <p className="text-xs text-green-400 mt-0.5">✅ Heute: {todayEntry.minutes} min</p>
                      )}
                      {!todayEntry && wellnessData.meditation.stats.streak >= 1 && (
                        <p className="text-xs text-orange-400 mt-0.5">⚠️ Streak risk: nicht heute</p>
                      )}
                    </div>
                  );
                })()}

                {/* Pushup KPI Card — always show if pushupData loaded */}
                {pushupData.currentDay > 0 && (() => {
                  const today = new Date().toISOString().split('T')[0];
                  const todayDone = pushupData.todayCompleted;
                  const pushupTrendVal = trendsData?.trends?.pushups;
                  const missedDays = Math.max(0, (() => {
                    const lastEntry = pushupData.last30?.[0];
                    if (!lastEntry) return 0;
                    const lastDate = new Date(lastEntry.date + "T00:00:00");
                    const now = new Date();
                    now.setHours(0,0,0,0);
                    return Math.floor((now.getTime() - lastDate.getTime()) / (1000*60*60*24)) - 1;
                  })());
                  return (
                    <div className="p-5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/50 text-xs">Push-up Challenge</span>
                        <span className="text-lg">💨</span>
                      </div>
                      <p className="text-2xl font-bold">Tag {pushupData.currentDay}<span className="text-sm text-white/40"> — {pushupData.todayReps ?? pushupData.currentDay} reps</span></p>
                      {todayDone ? (
                        <p className="text-xs text-green-400 mt-0.5">✅ Heute gemacht</p>
                      ) : (
                        <p className="text-xs text-orange-400 mt-0.5">⚠️ Heute noch nicht</p>
                      )}
                      {missedDays > 0 && (
                        <p className="text-xs text-red-400 mt-0.5">⚠️ {missedDays} Tag(e) verpasst</p>
                      )}
                      {pushupTrendVal && (
                        <p className={cn("text-xs font-medium mt-1", pushupTrendVal.change >= 0 ? "text-green-400" : "text-red-400")}>
                          {pushupTrendVal.change >= 0 ? "+" : ""}{pushupTrendVal.change}% vs prev week ({pushupTrendVal.value}/7d)
                        </p>
                      )}
                      {!todayDone && (
                        <button
                          onClick={() => { setPushupInput(String(pushupData.currentDay)); logPushups(); }}
                          className="mt-3 w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl text-white text-xs font-bold transition-all"
                        >
                          💨 Tag {pushupData.currentDay} jetzt loggen
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Gym Comeback Card — show when gap >= 5 days */}
                {(() => {
                  const gap = gymGapDays;
                  if (gap === null || gap < 5) return null;
                  const dow = new Date().getDay();
                  const nextDay = dow === 0 ? 'Mo' : dow === 1 ? 'Mi' : dow === 3 ? 'Fr' : dow === 5 ? 'Sa' : 'Mo';
                  const nextFull = dow === 0 ? 'Montag' : dow === 1 ? 'Mittwoch' : dow === 3 ? 'Freitag' : dow === 5 ? 'Samstag' : 'Montag';
                  return (
                    <div className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/5 backdrop-blur-xl rounded-2xl border border-orange-500/20">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">🏋️</span>
                            <h3 className="text-lg font-bold text-orange-300">Gym Comeback</h3>
                          </div>
                          <p className="text-white/40 text-sm mb-1">{gap} Tage Pause</p>
                          <p className="text-white/60 text-sm">Letzte Session: {gymLogs?.[gymLogs.length - 1] ?? 'unbekannt'}</p>
                          <p className="text-white/40 text-xs mt-1">Geplante Tage: Mo · Mi · Fr · Nächste: {nextFull}</p>
                        </div>
                        <button
                          onClick={() => setShowWorkoutModal(true)}
                          className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl font-bold text-white text-sm transition-all whitespace-nowrap"
                        >
                          🏋️ Quick Log Gym
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 4-Week Summary Grid */}
                <div className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-white/60" />
                    4-Week Summary
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-white/40 text-xs border-b border-white/10">
                          <th className="text-left pb-3 pr-4">Woche</th>
                          <th className="text-center pb-3 px-2">🏋️ Gym</th>
                          <th className="text-center pb-3 px-2">✅ Gewohnheiten</th>
                          <th className="text-center pb-3 px-2">😊 Stimmung</th>
                          <th className="text-center pb-3 px-2">😴 Schlaf</th>
                          <th className="text-center pb-3 px-2">🔥 Kalorien</th>
                          <th className="text-center pb-3 px-2">🥩 Protein</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...trendsData.weeks].reverse().map((week: any, wi: number) => {
                          const prev = trendsData.weeks[trendsData.weeks.length - 1 - wi - 1];
                          const pctColor = week.avgHabitPct >= 75 ? 'text-green-400' : week.avgHabitPct >= 50 ? 'text-yellow-400' : 'text-red-400';
                          const moodColor = week.avgMood >= 7 ? 'text-green-400' : week.avgMood >= 5 ? 'text-yellow-400' : 'text-red-400';
                          const sleepColor = week.avgSleep >= 7 ? 'text-green-400' : week.avgSleep >= 5 ? 'text-yellow-400' : 'text-red-400';
                          const gymDots = Array.from({ length: 7 }, (_, di) => {
                            const dayIdx = (trendsData.weeks.length - 1 - wi) * 7 + di;
                            const day = trendsData.days[dayIdx];
                            return day?.gym;
                          });
                          return (
                            <tr key={wi} className="border-b border-white/5 last:border-0">
                              <td className="py-3 pr-4 text-white/60 text-xs">Woche {week.week}</td>
                              <td className="py-3 px-2">
                                <div className="flex justify-center gap-0.5">
                                  {gymDots.map((gymmed, di) => (
                                    <div key={di} className={cn("w-3 h-3 rounded-sm", gymmed ? "bg-orange-500" : "bg-white/10")} />
                                  ))}
                                </div>
                              </td>
                              <td className={cn("py-3 px-2 text-center font-medium", pctColor)}>
                                {week.avgHabitPct > 0 ? `${week.avgHabitPct}%` : '—'}
                                {prev && week.avgHabitPct !== prev.avgHabitPct && (
                                  <span className={cn("ml-1 text-xs", week.avgHabitPct > prev.avgHabitPct ? "text-green-400" : "text-red-400")}>
                                    {week.avgHabitPct > prev.avgHabitPct ? '↑' : '↓'}
                                  </span>
                                )}
                              </td>
                              <td className={cn("py-3 px-2 text-center font-medium", moodColor)}>
                                {week.avgMood > 0 ? `${week.avgMood}/10` : '—'}
                                {prev && week.avgMood !== prev.avgMood && (
                                  <span className={cn("ml-1 text-xs", week.avgMood > prev.avgMood ? "text-green-400" : "text-red-400")}>
                                    {week.avgMood > prev.avgMood ? '↑' : '↓'}
                                  </span>
                                )}
                              </td>
                              <td className={cn("py-3 px-2 text-center font-medium", sleepColor)}>
                                {week.avgSleep > 0 ? `${week.avgSleep}h` : '—'}
                                {prev && week.avgSleep !== prev.avgSleep && (
                                  <span className={cn("ml-1 text-xs", week.avgSleep > prev.avgSleep ? "text-green-400" : "text-red-400")}>
                                    {week.avgSleep > prev.avgSleep ? '↑' : '↓'}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-2 text-center text-white/60">
                                {week.totalCalories > 0 ? `${(week.totalCalories/1000).toFixed(1)}k` : '—'}
                              </td>
                              <td className="py-3 px-2 text-center text-white/60">
                                {week.totalProtein > 0 ? `${week.totalProtein}g` : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-white/30 mt-3">Farben: Grün = gut (≥75%/7h+/7+), Gelb = mittel, Rot = ausbaufähig. Pfeile = Woche-zu-Woche Änderung.</p>
                </div>

                {/* AI Observations */}
                {(() => {
                  const obs: { emoji: string; label: string; text: string; color: string }[] = [];
                  const last7 = trendsData.days.slice(-7);
                  const missing = last7.filter((d: any) => d.habits.pct === 0);
                  if (missing.length >= 3) obs.push({ emoji: "⚠️", label: "Data Gap", text: `${missing.length} of the last 7 days have no habit data — use Retro-Log to fill in.`, color: "orange" });
                  const sleepDays = last7.filter((d: any) => d.sleep !== null);
                  if (sleepDays.length === 0 && trendsData.trends.sleep?.value === null) obs.push({ emoji: "😴", label: "Sleep Gap", text: "No sleep logged in 7+ days — your body needs rest tracking.", color: "orange" });
                  const moodDays = last7.filter((d: any) => d.mood !== null);
                  if (moodDays.length === 0 && trendsData.trends.mood?.value === null) obs.push({ emoji: "🧠", label: "Mood Gap", text: "No mood entries in 7+ days — log how you're feeling.", color: "orange" });
                  const waterDays = last7.filter((d: any) => d.water > 0);
                  if (waterDays.length === 0 && (trendsData.trends.water?.value === 0 || trendsData.trends.water?.value == null)) obs.push({ emoji: "💧", label: "Water Gap", text: "No water logged in 7+ days — aim for 8+ glasses daily.", color: "orange" });
                  const proteinDays = last7.filter((d: any) => d.nutrition?.protein > 0);
                  if (proteinDays.length === 0 && (trendsData.trends.protein?.value === 0 || trendsData.trends.protein?.value == null)) obs.push({ emoji: "🥩", label: "Protein Gap", text: "No protein logged in 7+ days — aim for 150g+ daily.", color: "orange" });
                  if (last7.filter((d: any) => d.habits.pct === 100).length >= 3) obs.push({ emoji: "🔥", label: "Perfect Days", text: `${last7.filter((d: any) => d.habits.pct === 100).length} perfect habit days this week — keep it up!`, color: "green" });
                  if (trendsData.trends.gym.change <= -30 && trendsData.trends.gym.value === 0) obs.push({ emoji: "💪", label: "Gym Restart", text: "No gym this week — schedule a session to restart your streak.", color: "orange" });
                  const gymGap = gymGapDays;
                  if (gymGap !== null && gymGap >= 10) obs.push({ emoji: "🔴", label: "Gym Relapse", text: `${gymGap} Tage seit letzter Session — Deine longest Pause seit ${gymLogs?.length ?? 0} Sessions.`, color: "red" });
                  if (trendsData.trends.gym.change >= 50 && trendsData.trends.gym.value >= 3) obs.push({ emoji: "🚀", label: "Gym Momentum", text: `${trendsData.trends.gym.value} gym days this week — best week in a while!`, color: "green" });
                  if (trendsData.trends.sleep.change <= -20 && trendsData.trends.sleep.value < 7) obs.push({ emoji: "😴", label: "Sleep Dip", text: `Sleep avg dropped ${Math.abs(trendsData.trends.sleep.change)}% vs last week — aim for 7h+.`, color: "yellow" });
                  if (trendsData.trends.habits.change >= 20) obs.push({ emoji: "📈", label: "Habits Climbing", text: `Habit completion up ${trendsData.trends.habits.change}% vs last week.`, color: "green" });
                  if (trendsData.trends.habits.change <= -20) obs.push({ emoji: "📉", label: "Habits Declining", text: `Habit completion down ${Math.abs(trendsData.trends.habits.change)}% vs last week.`, color: "red" });
                  if (trendsData.streaks.gym >= 5) obs.push({ emoji: "🎯", label: "Gym Streak Active", text: `${trendsData.streaks.gym}-day gym streak — don't break it!`, color: "green" });
                  if (obs.length === 0) obs.push({ emoji: "✅", label: "Alles im Griff", text: "No major issues detected. Stay consistent!", color: "blue" });
                  const colorMap: Record<string, string> = { green: "bg-green-500/10 border-green-500/20", orange: "bg-orange-500/10 border-orange-500/20", yellow: "bg-yellow-500/10 border-yellow-500/20", red: "bg-red-500/10 border-red-500/20", blue: "bg-blue-500/10 border-blue-500/20" };
                  const textMap: Record<string, string> = { green: "text-green-300", orange: "text-orange-300", yellow: "text-yellow-300", red: "text-red-300", blue: "text-blue-300" };
                  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{obs.map((o, i) => (<div key={i} className={cn("p-4 rounded-2xl border backdrop-blur-xl", colorMap[o.color])}><div className="flex items-center gap-2 mb-1"><span className="text-lg">{o.emoji}</span><span className={cn("text-sm font-bold", textMap[o.color])}>{o.label}</span></div><p className="text-sm text-white/60">{o.text}</p></div>))}</div>;
                })()}

                {/* 30-Day Gym Chart */}
                <div className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-orange-400" />
                    Gym — Last 30 Days
                  </h3>
                  <div className="grid grid-cols-6 md:grid-cols-10 gap-1">
                    {trendsData.days.slice(-30).map((day: any) => (
                      <div
                        key={day.date}
                        className={cn(
                          "aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all hover:scale-110 cursor-default",
                          day.gym
                            ? "bg-gradient-to-br from-orange-500 to-red-500 text-white"
                            : "bg-white/5 text-white/30"
                        )}
                        title={`${day.date} ${day.gym ? "✅ Gym" : "rest"}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-6 mt-3 text-xs text-white/40">
                    <span>● Gym day</span>
                    <span>○ Rest day</span>
                    <span className="ml-auto">Streak: {trendsData.streaks.gym} days</span>
                  </div>
                </div>

                {/* 30-Day Habits Chart */}
                <div className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    Habit Completion — Last 30 Days
                  </h3>
                  <div className="flex items-end gap-1 h-20">
                    {trendsData.days.slice(-30).map((day: any) => (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={cn("w-full rounded-t-md transition-all",
                            day.habits.pct === 100 ? "bg-green-500" :
                            day.habits.pct >= 66 ? "bg-green-400/70" :
                            day.habits.pct >= 33 ? "bg-yellow-400/60" :
                            day.habits.pct > 0 ? "bg-orange-400/50" :
                            "bg-white/10"
                          )}
                          style={{ height: `${Math.max(4, day.habits.pct)}%` }}
                          title={`${day.date}: ${day.habits.done}/${day.habits.total} (${day.habits.pct}%)`}
                        />
                        <span className="text-white/20 text-xs">{day.dayName}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-white/40">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500" /> 100%</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-400/60" /> 33-66%</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-white/10" /> 0%</span>
                    <span className="ml-auto">Habit streak: {trendsData.streaks.habit} days</span>
                  </div>
                </div>

                {/* Weekly Summary Table */}
                <div className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                  <h3 className="text-lg font-bold mb-4">Weekly Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-white/40 border-b border-white/10">
                          <th className="text-left pb-3 font-medium">Week</th>
                          <th className="text-center pb-3 font-medium">Gym</th>
                          <th className="text-center pb-3 font-medium">Habits</th>
                          <th className="text-center pb-3 font-medium">Mood</th>
                          <th className="text-center pb-3 font-medium">Sleep</th>
                          <th className="text-right pb-3 font-medium">Calories</th>
                          <th className="text-right pb-3 font-medium">Protein</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...trendsData.weeks].reverse().map((week: any) => (
                          <tr key={week.week} className="border-b border-white/5">
                            <td className="py-3 font-medium">Week {week.week}</td>
                            <td className="text-center py-3">
                              <span className={cn("px-2 py-1 rounded-md text-xs font-bold",
                                week.gymDays >= 4 ? "bg-green-500/20 text-green-400" :
                                week.gymDays >= 2 ? "bg-yellow-500/20 text-yellow-400" :
                                "bg-white/5 text-white/30"
                              )}>{week.gymDays} days</span>
                            </td>
                            <td className="text-center py-3">
                              <span className={cn("font-bold",
                                week.avgHabitPct >= 75 ? "text-green-400" :
                                week.avgHabitPct >= 50 ? "text-yellow-400" :
                                "text-white/40"
                              )}>{week.avgHabitPct}%</span>
                            </td>
                            <td className="text-center py-3">
                              <span className={week.avgMood >= 7 ? "text-green-400" : week.avgMood >= 5 ? "text-yellow-400" : "text-white/40"}>
                                {week.avgMood || "—"}/10
                              </span>
                            </td>
                            <td className="text-center py-3 text-white/60">{week.avgSleep || "—"}h</td>
                            <td className="text-right py-3 text-white/60">{week.totalCalories.toLocaleString()} kcal</td>
                            <td className="text-right py-3 text-white/60">{week.totalProtein ? `${week.totalProtein.toLocaleString()}g` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
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

              {/* Strength: Exercise Logger */}
              {workoutType === 'strength' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm text-white/50">Exercises ({workoutExercises.length})</label>
                    {workoutExercises.length > 0 && (
                      <span className="text-xs text-orange-400">{workoutExercises.reduce((s, e) => s + e.sets, 0)} total sets</span>
                    )}
                  </div>

                  {/* Added Exercises */}
                  {workoutExercises.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {workoutExercises.map((ex, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-lg text-xs">
                          <span className="text-orange-300 font-medium">{ex.name}</span>
                          <span className="text-white/50">{ex.sets}x{ex.reps}</span>
                          {ex.weight > 0 && <span className="text-white/40">{ex.weight}kg</span>}
                          <button onClick={() => removeExercise(i)} className="ml-1 text-white/30 hover:text-red-400 transition-colors">x</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Add by Muscle Group */}
                  <div className="mb-3">
                    <p className="text-xs text-white/30 mb-2">Quick Add</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(COMMON_EXERCISES).map(([muscle, exs]) => (
                        <div key={muscle} className="relative group">
                          <button className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white/60 hover:bg-orange-500/20 hover:border-orange-500/30 hover:text-orange-300 transition-all">
                            {muscle}
                          </button>
                          <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-10 bg-[#1a1a1a] border border-white/20 rounded-xl p-2 shadow-xl min-w-32">
                            {exs.map(ex => (
                              <button
                                key={ex}
                                onClick={() => { setNewExerciseName(ex); addExercise(); }}
                                className="block w-full text-left px-2 py-1 text-xs text-white/70 hover:text-orange-300 hover:bg-orange-500/10 rounded transition-all"
                              >
                                {ex}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Exercise Input */}
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Custom exercise..."
                      value={newExerciseName}
                      onChange={e => setNewExerciseName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addExercise(); } }}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50"
                    />
                    <input
                      type="number"
                      placeholder="Sets"
                      value={newExerciseSets || ''}
                      onChange={e => setNewExerciseSets(Number(e.target.value))}
                      className="w-14 px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 text-center"
                    />
                    <input
                      type="number"
                      placeholder="Reps"
                      value={newExerciseReps || ''}
                      onChange={e => setNewExerciseReps(Number(e.target.value))}
                      className="w-14 px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 text-center"
                    />
                    <input
                      type="number"
                      placeholder="kg"
                      value={newExerciseWeight || ''}
                      onChange={e => setNewExerciseWeight(Number(e.target.value))}
                      className="w-14 px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 text-center"
                    />
                    <button
                      onClick={addExercise}
                      className="px-3 py-2 bg-orange-500/30 hover:bg-orange-500/50 border border-orange-500/40 rounded-lg text-xs text-orange-300 font-medium transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm text-white/50 mb-2">Notes</label>
                <textarea
                  value={workoutNotes}
                  onChange={e => setWorkoutNotes(e.target.value)}
                  placeholder="How did you feel? Any PRs?"
                  rows={2}
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

        {/* Retro-Log Modal */}
        {showRetroModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md p-8 bg-[#111] rounded-3xl border border-cyan-500/30 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-xl">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                </div>
                Retro-Log
              </h3>

              {/* Mode Toggle */}
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => { setRetroBulkMode(false); setRetroDate(new Date().toISOString().split("T")[0]); }}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                    !retroBulkMode
                      ? "bg-cyan-500/30 border border-cyan-500/50 text-cyan-300"
                      : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                  )}
                >
                  📅 Einzeltag
                </button>
                <button
                  onClick={() => setRetroBulkMode(true)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                    retroBulkMode
                      ? "bg-cyan-500/30 border border-cyan-500/50 text-cyan-300"
                      : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                  )}
                >
                  📆 Bereich
                </button>
              </div>

              {/* SINGLE MODE: Date Picker */}
              {!retroBulkMode && (
              <div className="mb-5">
                <label className="block text-sm text-white/50 mb-2">Datum</label>
                <input
                  type="date"
                  value={retroDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={e => setRetroDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              )}

              {/* BULK MODE: Date Range + Category */}
              {retroBulkMode && (
              <div className="mb-5 space-y-4">
                <div>
                  <label className="block text-sm text-white/50 mb-2">Zeitraum</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="date"
                      value={retroDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={e => setRetroDate(e.target.value)}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                    />
                    <span className="text-white/30">→</span>
                    <input
                      type="date"
                      value={retroBulkEndDate || new Date().toISOString().split("T")[0]}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={e => setRetroBulkEndDate(e.target.value)}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-2">Kategorie</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(["habits", "sleep", "mood"] as const).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setRetroBulkCategory(cat)}
                        className={cn(
                          "py-2 px-1 rounded-xl text-xs font-medium capitalize transition-all",
                          retroBulkCategory === cat
                            ? "bg-cyan-500/30 border border-cyan-500/50 text-cyan-300"
                            : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                        )}
                      >
                        {cat === "habits" ? "🏋️ Habits" : cat === "sleep" ? "😴 Sleep" : "💭 Mood"}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Bulk Habits */}
                {retroBulkCategory === "habits" && (
                  <div>
                    <label className="block text-sm text-white/50 mb-2">Standards für fehlende Tage — aktiviert = gemacht</label>
                    <div className="grid grid-cols-3 gap-2">
                      {HABITS.map(h => (
                        <button
                          key={h.id}
                          onClick={() => setRetroBulkHabits(prev => ({ ...prev, [h.id]: !prev[h.id] }))}
                          className={cn(
                            "p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1",
                            retroBulkHabits[h.id]
                              ? "bg-green-500/20 border-green-500/30 text-green-300"
                              : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                          )}
                        >
                          <span className="text-xl">{h.emoji}</span>
                          <span>{h.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-white/30 mt-2">Alle angehakten Habits werden für jeden Tag im Zeitraum eingetragen.</p>
                  </div>
                )}
                {/* Bulk Sleep */}
                {retroBulkCategory === "sleep" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/50 mb-2">Schlafstunden: {retroBulkSleepH}h</label>
                      <input type="range" min="3" max="12" step="0.5" value={retroBulkSleepH}
                        onChange={e => setRetroBulkSleepH(Number(e.target.value))}
                        className="w-full accent-cyan-500" />
                      <div className="flex justify-between text-xs text-white/30 mt-1"><span>3h</span><span>12h</span></div>
                    </div>
                    <div>
                      <label className="block text-sm text-white/50 mb-2">Qualität: {retroBulkSleepQ}/5</label>
                      <input type="range" min="1" max="5" step="1" value={retroBulkSleepQ}
                        onChange={e => setRetroBulkSleepQ(Number(e.target.value))}
                        className="w-full accent-cyan-500" />
                      <div className="flex justify-between text-xs text-white/30 mt-1"><span>1</span><span>5</span></div>
                    </div>
                    <p className="text-xs text-white/30">Dieselben Werte werden für jeden Tag im Zeitraum eingetragen.</p>
                  </div>
                )}
                {/* Bulk Mood */}
                {retroBulkCategory === "mood" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/50 mb-2">Energy: {retroBulkMoodE}/10</label>
                      <input type="range" min="1" max="10" step="1" value={retroBulkMoodE}
                        onChange={e => setRetroBulkMoodE(Number(e.target.value))}
                        className="w-full accent-rose-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-white/50 mb-2">Stimmung: {retroBulkMoodV}/10</label>
                      <input type="range" min="1" max="10" step="1" value={retroBulkMoodV}
                        onChange={e => setRetroBulkMoodV(Number(e.target.value))}
                        className="w-full accent-pink-500" />
                    </div>
                    <p className="text-xs text-white/30">Dieselben Werte werden für jeden Tag im Zeitraum eingetragen.</p>
                  </div>
                )}
              </div>
              )}

              {/* SINGLE MODE: Category Selector */}
              {!retroBulkMode && (
              <div className="mb-5">
                <label className="block text-sm text-white/50 mb-2">Kategorie</label>
                <div className="grid grid-cols-5 gap-1">
                  {(["habits", "sleep", "gym", "mood", "water"] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setRetroCategory(cat)}
                      className={cn(
                        "py-2 px-1 rounded-xl text-xs font-medium capitalize transition-all",
                        retroCategory === cat
                          ? "bg-cyan-500/30 border border-cyan-500/50 text-cyan-300"
                          : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                      )}
                    >
                      {cat === "habits" ? "🏋️ Habits" : cat === "sleep" ? "😴 Sleep" : cat === "gym" ? "💪 Gym" : cat === "mood" ? "💭 Mood" : "💧 Wasser"}
                    </button>
                  ))}
                </div>
              </div>
              )}
              <div className="mb-5">
                <label className="block text-sm text-white/50 mb-2">Datum</label>
                <input
                  type="date"
                  value={retroDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={e => setRetroDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Category Selector */}
              <div className="mb-5">
                <label className="block text-sm text-white/50 mb-2">Kategorie</label>
                <div className="grid grid-cols-5 gap-1">
                  {(["habits", "sleep", "gym", "mood", "water"] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setRetroCategory(cat)}
                      className={cn(
                        "py-2 px-1 rounded-xl text-xs font-medium capitalize transition-all",
                        retroCategory === cat
                          ? "bg-cyan-500/30 border border-cyan-500/50 text-cyan-300"
                          : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                      )}
                    >
                      {cat === "habits" ? "🏋️ Habits" : cat === "sleep" ? "😴 Sleep" : cat === "gym" ? "💪 Gym" : cat === "mood" ? "💭 Mood" : "💧 Wasser"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Habits Form */}
              {retroCategory === "habits" && (
                <div className="mb-5">
                  <label className="block text-sm text-white/50 mb-2">Erledigte Habits am {retroDate}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {HABITS.map(h => (
                      <button
                        key={h.id}
                        onClick={() => setRetroHabits(prev => ({ ...prev, [h.id]: !prev[h.id] }))}
                        className={cn(
                          "p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1",
                          retroHabits[h.id]
                            ? "bg-green-500/20 border-green-500/30 text-green-300"
                            : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                        )}
                      >
                        <span className="text-xl">{h.emoji}</span>
                        <span>{h.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sleep Form */}
              {retroCategory === "sleep" && (
                <div className="mb-5 space-y-4">
                  <div>
                    <label className="block text-sm text-white/50 mb-2">Schlafstunden: {retroSleepHours}h</label>
                    <input
                      type="range"
                      min="3"
                      max="12"
                      step="0.5"
                      value={retroSleepHours}
                      onChange={e => setRetroSleepHours(Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                    <div className="flex justify-between text-xs text-white/30 mt-1"><span>3h</span><span>12h</span></div>
                  </div>
                  <div>\n                    <label className="block text-sm text-white/50 mb-2">Qualität: {retroSleepQuality}/5</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={retroSleepQuality}
                      onChange={e => setRetroSleepQuality(Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                    <div className="flex justify-between text-xs text-white/30 mt-1"><span>1</span><span>5</span></div>
                  </div>
                </div>
              )}

              {/* Gym Form */}
              {retroCategory === "gym" && (
                <div className="mb-5 space-y-4">
                  <div>
                    <label className="block text-sm text-white/50 mb-2">Muskeln (kommagetrennt)</label>
                    <input
                      type="text"
                      value={retroGymMuscles}
                      onChange={e => setRetroGymMuscles(e.target.value)}
                      placeholder="z.B. Brust, Trizeps"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-2">Übungen (kommagetrennt)</label>
                    <input
                      type="text"
                      value={retroGymExercises}
                      onChange={e => setRetroGymExercises(e.target.value)}
                      placeholder="z.B. Bankdrücken, Kurzhantel flies"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-2">Notiz (optional)</label>
                    <textarea
                      value={retroGymNotes}
                      onChange={e => setRetroGymNotes(e.target.value)}
                      placeholder="z.B. Neuer Trainingsplan"
                      rows={2}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Mood Form */}
              {retroCategory === "mood" && (
                <div className="mb-5 space-y-4">
                  <div>
                    <label className="block text-sm text-white/50 mb-2">Energy: {retroMoodEnergy}/10</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={retroMoodEnergy}
                      onChange={e => setRetroMoodEnergy(Number(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                    <div className="flex justify-between text-xs text-white/30 mt-1"><span>1</span><span>10</span></div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-2">Stimmung: {retroMoodValue}/10</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={retroMoodValue}
                      onChange={e => setRetroMoodValue(Number(e.target.value))}
                      className="w-full accent-pink-500"
                    />
                    <div className="flex justify-between text-xs text-white/30 mt-1"><span>1</span><span>10</span></div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/50 mb-2">Notiz (optional)</label>
                    <textarea
                      value={retroMoodNote}
                      onChange={e => setRetroMoodNote(e.target.value)}
                      placeholder="Wie war der Tag?"
                      rows={2}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Water Form */}
              {retroCategory === "water" && (
                <div className="mb-5 space-y-4">
                  <div>
                    <label className="block text-sm text-white/50 mb-2">Gläser: {retroWater}</label>
                    <input
                      type="range"
                      min="0"
                      max="16"
                      step="1"
                      value={retroWater}
                      onChange={e => setRetroWater(Number(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                    <div className="flex justify-between text-xs text-white/30 mt-1"><span>0</span><span>16</span></div>
                  </div>
                  <div className="flex gap-2">
                    {[4, 6, 8, 10].map(n => (
                      <button
                        key={n}
                        onClick={() => setRetroWater(n)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                          retroWater === n
                            ? "bg-cyan-500/30 border border-cyan-500/50 text-cyan-300"
                            : "bg-white/5 border border-white/10 text-white/50 hover:border-white/20"
                        )}
                      >
                        {n} Gläser
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRetroModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 font-medium transition-all"
                >
                  Abbrechen
                </button>
                <button
                  onClick={submitRetroLog}
                  disabled={retroSaving}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                >
                  {retroSaving ? "Speichern..." : "Speichern"}
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