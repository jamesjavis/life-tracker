"use client";

import { useState, useEffect } from "react";
import { Flame, Target, Dumbbell, TrendingUp, Check, Trophy, Zap, Star, Calendar, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

type Streak = {
  id: string;
  name: string;
  icon: string;
  completedToday: boolean;
  streak: number;
  bestStreak: number;
  history: boolean[];
};

type BucketItem = {
  id: string;
  title: string;
  category: string;
  completed: boolean;
};

const loadData = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
};

const saveData = <T,>(key: string, data: T): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
};

const initialStreaks: Streak[] = [
  { id: "1", name: "Duolingo", icon: "🇪🇸", completedToday: false, streak: 12, bestStreak: 45, history: [true,true,true,true,true,true,true] },
  { id: "2", name: "Yoga", icon: "🧘", completedToday: false, streak: 5, bestStreak: 30, history: [true,true,false,true,true,false,true] },
  { id: "3", name: "Atemübung", icon: "🌬️", completedToday: false, streak: 8, bestStreak: 14, history: [true,true,true,true,true,true,true] },
  { id: "4", name: "Meditation", icon: "🧠", completedToday: false, streak: 3, bestStreak: 21, history: [false,true,true,true,false,true,true] },
  { id: "5", name: "Gym", icon: "💪", completedToday: false, streak: 6, bestStreak: 28, history: [true,false,true,true,true,false,true] },
  { id: "6", name: "Smoothie", icon: "🥤", completedToday: true, streak: 15, bestStreak: 15, history: [true,true,true,true,true,true,true] },
  { id: "7", name: "Creatin + Salz", icon: "🧂", completedToday: true, streak: 20, bestStreak: 20, history: [true,true,true,true,true,true,true] },
  { id: "8", name: "Lesen (5 Seiten)", icon: "📖", completedToday: false, streak: 2, bestStreak: 10, history: [true,false,true,true,false,true,false] },
];

const initialBucketList: BucketItem[] = [
  { id: "1", title: "Halbmarathon laufen", category: "Sport", completed: false },
  { id: "2", title: "In die USA reisen", category: "Reisen", completed: false },
  { id: "3", title: "Ein eigenes Spiel launchen", category: "Business", completed: false },
  { id: "4", title: "100kg Bankdrücken", category: "Sport", completed: false },
  { id: "5", title: "Eine Million verdienen", category: "Finance", completed: false },
  { id: "6", title: "30 Tage Streak", category: "Habit", completed: false },
];

export default function LifeTracker() {
  const [streaks, setStreaks] = useState<Streak[]>(initialStreaks);
  const [bucketList, setBucketList] = useState<BucketItem[]>(initialBucketList);
  const [activeTab, setActiveTab] = useState<"streaks" | "bucket" | "gym" | "analytics">("streaks");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setStreaks(loadData("life-streaks-v2", initialStreaks));
    setBucketList(loadData("life-bucket-v2", initialBucketList));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveData("life-streaks-v2", streaks);
      saveData("life-bucket-v2", bucketList);
    }
  }, [streaks, bucketList, isLoaded]);

  const totalStreakDays = streaks.reduce((sum, s) => sum + s.streak, 0);
  const completedToday = streaks.filter(s => s.completedToday).length;
  const completionRate = Math.round((completedToday / streaks.length) * 100);
  const longestStreak = Math.max(...streaks.map(s => s.bestStreak));
  const weeklyAverage = Math.round(streaks.reduce((sum, s) => {
    const weekDays = s.history.filter(Boolean).length;
    return sum + weekDays;
  }, 0) / streaks.length * 10) / 10;

  const toggleStreak = (id: string) => {
    setStreaks(prev => prev.map(s => {
      if (s.id === id) {
        const newCompletedToday = !s.completedToday;
        const newStreak = newCompletedToday ? s.streak + 1 : Math.max(0, s.streak - 1);
        const newBest = Math.max(s.bestStreak, newStreak);
        const newHistory = [...s.history.slice(1), newCompletedToday];
        return { ...s, completedToday: newCompletedToday, streak: newStreak, bestStreak: newBest, history: newHistory };
      }
      return s;
    }));
  };

  const toggleBucketItem = (id: string) => {
    setBucketList(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const getWeekDays = () => ['M', 'D', 'M', 'D', 'F', 'S', 'S'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Life Tracker
            </h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "streaks", icon: "🔥", color: "bg-orange-500", label: "Streaks" },
              { key: "bucket", icon: "🎯", color: "bg-amber-500", label: "Goals" },
              { key: "gym", icon: "💪", color: "bg-red-500", label: "Gym" },
              { key: "analytics", icon: "📊", color: "bg-blue-500", label: "Analytics" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all transform hover:scale-105",
                  activeTab === tab.key ? `${tab.color} text-white shadow-lg shadow-orange-500/25` : "bg-slate-700/50 text-slate-300 hover:bg-slate-600"
                )}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Overview - Enhanced */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { icon: Flame, color: "from-orange-500 to-red-500", label: "Total Days", value: totalStreakDays, sub: "All Time" },
            { icon: Check, color: "from-green-500 to-emerald-500", label: "Today", value: `${completedToday}/${streaks.length}`, sub: `${completionRate}%` },
            { icon: Zap, color: "from-yellow-500 to-amber-500", label: "Weekly Avg", value: weeklyAverage, sub: "days/week" },
            { icon: Trophy, color: "from-purple-500 to-pink-500", label: "Best Streak", value: longestStreak, sub: "days" },
            { icon: Star, color: "from-blue-500 to-cyan-500", label: "Goals", value: `${bucketList.filter(b => b.completed).length}/${bucketList.length}`, sub: "Done" },
          ].map((stat, i) => (
            <div key={i} className={cn("bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 backdrop-blur-sm")}>
              <div className={cn(`bg-gradient-to-r ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-lg`)}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
              <p className="text-xs text-slate-500">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Streaks Tab */}
        {activeTab === "streaks" && (
          <div className="space-y-3">
            {streaks.map(streak => (
              <div
                key={streak.id}
                className={cn(
                  "group relative flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer transform hover:scale-[1.01]",
                  streak.completedToday ? "bg-gradient-to-r from-green-500/20 to-emerald-500/10 border-green-500/30" : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600"
                )}
                onClick={() => toggleStreak(streak.id)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{streak.icon}</span>
                  <div>
                    <p className="font-bold text-lg">{streak.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {streak.history.map((done, i) => (
                        <div key={i} className={cn(
                          "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
                          done ? "bg-green-500/30 text-green-400" : "bg-slate-700/50 text-slate-500"
                        )}>
                          {done && <Check className="h-3 w-3" />}
                        </div>
                      ))}
                      <span className="text-xs text-slate-500 ml-2">this week</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={cn("text-3xl font-bold", streak.completedToday ? "text-green-400" : "text-slate-400")}>
                      {streak.streak}
                    </p>
                    <p className="text-xs text-slate-500">best: {streak.bestStreak}</p>
                  </div>
                  {streak.completedToday && (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                      <Check className="h-7 w-7 text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bucket List Tab */}
        {activeTab === "bucket" && (
          <div className="grid md:grid-cols-2 gap-4">
            {bucketList.map(item => (
              <div
                key={item.id}
                className={cn(
                  "p-5 rounded-2xl border transition-all cursor-pointer transform hover:scale-[1.02]",
                  item.completed ? "bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-amber-500/30" : "bg-slate-800/50 border-slate-700/50 hover:border-amber-500/50"
                )}
                onClick={() => toggleBucketItem(item.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                    item.completed ? "border-amber-500 bg-amber-500 shadow-lg shadow-amber-500/30" : "border-slate-500"
                  )}>
                    {item.completed && <Check className="h-5 w-5 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={cn("font-bold text-lg", item.completed && "line-through text-slate-500")}>
                      {item.title}
                    </p>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-700/50 text-slate-400">{item.category}</span>
                  </div>
                </div>
              </div>
            ))}
            <button
              className="p-5 rounded-2xl border-2 border-dashed border-slate-600 text-slate-400 hover:border-amber-500 hover:text-amber-400 transition-all"
              onClick={() => {
                const title = prompt("Was ist dein neues Ziel?");
                if (title) setBucketList(prev => [...prev, { id: Date.now().toString(), title, category: "Custom", completed: false }]);
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <Star className="h-5 w-5" />
                <span className="font-bold">Neues Ziel hinzufügen</span>
              </div>
            </button>
          </div>
        )}

        {/* Gym Tab */}
        {activeTab === "gym" && (
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: "Push Day", subtitle: "Brust, Schulter, Trizeps", color: "from-red-500 to-orange-500", exercises: ["Bankdrücken: 4x8-12", "Schrägbank: 3x10-12", "Schulterdrücken: 3x10-12", "Trizeps: 3x12-15"] },
              { title: "Pull Day", subtitle: "Rücken, Bizeps", color: "from-blue-500 to-cyan-500", exercises: ["Klimmzüge: 4x8-12", "Rudern: 3x10-12", "Latzug: 3x10-12", "Bizeps: 3x12-15"] },
              { title: "Leg Day", subtitle: "Beine", color: "from-green-500 to-emerald-500", exercises: ["Kniebeugen: 4x8-12", "Beinpresse: 3x10-12", "Beinbizeps: 3x12-15", "Waden: 4x15-20"] },
            ].map((day, i) => (
              <div key={i} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-r shadow-lg mb-4 flex items-center justify-center", day.color)}>
                  <Dumbbell className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-1">{day.title}</h3>
                <p className="text-sm text-slate-400 mb-4">{day.subtitle}</p>
                <ul className="space-y-2">
                  {day.exercises.map((ex, j) => (
                    <li key={j} className="text-sm text-slate-300 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Completion Rate Chart */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-400" />
                Weekly Completion Rate
              </h3>
              <div className="h-8 bg-slate-700/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-slate-400">0%</span>
                <span className="text-orange-400 font-bold">{completionRate}%</span>
                <span className="text-slate-400">100%</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/10 rounded-2xl p-6 border border-orange-500/20">
                <TrendingUp className="h-8 w-8 text-orange-400 mb-2" />
                <p className="text-3xl font-bold">{totalStreakDays}</p>
                <p className="text-sm text-slate-400">Total Streak Days</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20">
                <Trophy className="h-8 w-8 text-purple-400 mb-2" />
                <p className="text-3xl font-bold">{longestStreak}</p>
                <p className="text-sm text-slate-400">Longest Streak</p>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-2xl p-6 border border-green-500/20">
                <Check className="h-8 w-8 text-green-400 mb-2" />
                <p className="text-3xl font-bold">{completedToday}</p>
                <p className="text-sm text-slate-400">Completed Today</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/10 rounded-2xl p-6 border border-blue-500/20">
                <Star className="h-8 w-8 text-blue-400 mb-2" />
                <p className="text-3xl font-bold">{bucketList.filter(b => b.completed).length}</p>
                <p className="text-sm text-slate-400">Goals Done</p>
              </div>
            </div>

            {/* Weekly Overview */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-bold mb-4">This Week Overview</h3>
              <div className="grid grid-cols-7 gap-2">
                {getWeekDays().map((day, i) => {
                  const dayComplete = streaks.filter(s => s.history[i]).length;
                  const dayRate = Math.round((dayComplete / streaks.length) * 100);
                  return (
                    <div key={i} className="text-center">
                      <p className="text-xs text-slate-500 mb-2">{day}</p>
                      <div className={cn(
                        "h-16 rounded-xl flex items-end justify-center pb-2",
                        dayRate >= 70 ? "bg-green-500/30" : dayRate >= 40 ? "bg-amber-500/30" : "bg-slate-700/50"
                      )}>
                        <span className="text-lg font-bold">{dayRate}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Habit Matrix - Visual Grid */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-green-400" />
                Habit Consistency Matrix
              </h3>
              <div className="grid gap-2">
                {streaks.map(streak => {
                  const totalWeekDays = streak.history.filter(Boolean).length;
                  const consistency = Math.round((totalWeekDays / 7) * 100);
                  return (
                    <div key={streak.id} className="flex items-center gap-3">
                      <span className="text-xl w-8">{streak.icon}</span>
                      <span className="w-24 text-sm font-medium truncate">{streak.name}</span>
                      <div className="flex-1 h-4 bg-slate-700/50 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            consistency >= 70 ? "bg-gradient-to-r from-green-500 to-emerald-500" :
                            consistency >= 40 ? "bg-gradient-to-r from-amber-500 to-yellow-500" :
                            "bg-gradient-to-r from-red-500 to-orange-500"
                          )}
                          style={{ width: `${consistency}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-12 text-right">{consistency}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Consistency Score */}
            {(() => {
              const consistencyScores = streaks.map(s => {
                const weekDays = s.history.filter(Boolean).length;
                return weekDays / 7;
              });
              const avgConsistency = Math.round(consistencyScores.reduce((a, b) => a + b, 0) / consistencyScores.length * 100);
              const perfectDays = streaks.filter(s => s.history.every(Boolean)).length;
              
              return (
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-slate-600/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">🔥 Consistency Score</h3>
                      <p className="text-sm text-slate-400">Based on 7-day habit completion</p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-5xl font-bold",
                        avgConsistency >= 70 ? "text-green-400" : avgConsistency >= 40 ? "text-amber-400" : "text-red-400"
                      )}>{avgConsistency}%</p>
                      <p className="text-sm text-slate-400">{perfectDays} perfect days this week</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
