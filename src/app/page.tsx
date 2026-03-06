"use client";

import { useState, useEffect } from "react";
import { Flame, Target, Dumbbell, TrendingUp, Check, Trophy, Zap, Star, Calendar, Activity, Brain, Plus, Save, Briefcase, Rocket, DollarSign, Globe, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Streak = {
  id: string;
  name: string;
  icon: string;
  completedToday: boolean;
  streak: number;
  bestStreak: number;
  history: boolean[];
  totalExercises?: number; // For tracking like Gym
};

type GymEntry = {
  id: string;
  date: string;
  type: string; // "Push", "Pull", "Leg"
  exercises: { name: string; sets: number; reps: number; weight?: number }[];
};

type Project = {
  id: string;
  name: string;
  description: string;
  status: "active" | "planning" | "paused" | "done";
  priority: "high" | "medium" | "low";
  nextAction: string;
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

// Patrick's actual data from Notion + his input
const PATRICK_STREAKS: Streak[] = [
  { id: "1", name: "Duolingo", icon: "🏃", completedToday: false, streak: 147, bestStreak: 147, history: [true,true,true,true,true,true,true], totalExercises: 0 },
  { id: "2", name: "Yoga", icon: "🧘", completedToday: true, streak: 130, bestStreak: 130, history: [true,true,true,true,true,true,true], totalExercises: 383 },
  { id: "3", name: "Meditation", icon: "🧠", completedToday: false, streak: 6, bestStreak: 6, history: [true,true,true,true,true,true,false], totalExercises: 520 },
  { id: "4", name: "Atemübung", icon: "🌬️", completedToday: true, streak: 147, bestStreak: 147, history: [true,true,true,true,true,true,true], totalExercises: 0 },
  { id: "5", name: "Gym", icon: "💪", completedToday: false, streak: 0, bestStreak: 0, history: [true,true,true,true,true,true,true], totalExercises: 0 }, // Will add workout entries
  { id: "6", name: "Smoothie", icon: "🥤", completedToday: true, streak: 147, bestStreak: 147, history: [true,true,true,true,true,true,true], totalExercises: 0 },
  { id: "7", name: "Creatin + Salz", icon: "💊", completedToday: true, streak: 147, bestStreak: 147, history: [true,true,true,true,true,true,true], totalExercises: 0 },
  { id: "8", name: "Lesen (5 Seiten)", icon: "📖", completedToday: true, streak: 147, bestStreak: 147, history: [true,true,true,true,true,true,true], totalExercises: 0 },
];

const DEFAULT_PROJECTS: Project[] = [
  { id: "1", name: "Benefitsi", description: "FlutterFlow App - Partner-Programm", status: "active", priority: "high", nextAction: "Algolia-Optimierung" },
  { id: "2", name: "eWorld Record", description: "Games auf Abstract blockchain", status: "planning", priority: "medium", nextAction: "Konzept erstellen" },
  { id: "3", name: "Abstract Spiel", description: "Eigenes Spiel auf Abstract", status: "planning", priority: "medium", nextAction: "Game Design" },
  { id: "4", name: "Preis Arbitrage", description: "Automatisiertes Trading", status: "planning", priority: "low", nextAction: "Research" },
  { id: "5", name: "Amigo Creator", description: "Creator Trading auf Amigo", status: "active", priority: "high", nextAction: "HEUTE launchen!" },
];

export default function LifeTracker() {
  const [streaks, setStreaks] = useState<Streak[]>(PATRICK_STREAKS);
  const [gymEntries, setGymEntries] = useState<GymEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [activeTab, setActiveTab] = useState<"overview" | "streaks" | "gym" | "projects">("overview");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Gym entry form
  const [showGymForm, setShowGymForm] = useState(false);
  const [gymType, setGymType] = useState<"Push" | "Pull" | "Leg">("Push");
  const [exercises, setExercises] = useState([{ name: "", sets: 3, reps: 10, weight: 0 }]);

  useEffect(() => {
    setStreaks(loadData("patrick-streaks", PATRICK_STREAKS));
    setGymEntries(loadData("patrick-gym", []));
    setProjects(loadData("patrick-projects", DEFAULT_PROJECTS));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveData("patrick-streaks", streaks);
      saveData("patrick-gym", gymEntries);
      saveData("patrick-projects", projects);
    }
  }, [streaks, gymEntries, projects, isLoaded]);

  const completedToday = streaks.filter(s => s.completedToday).length;
  const totalExercises = gymEntries.reduce((sum, e) => sum + e.exercises.length, 0);

  const toggleStreak = (id: string) => {
    setStreaks(prev => prev.map(s => {
      if (s.id === id) {
        const newCompletedToday = !s.completedToday;
        const newStreak = newCompletedToday ? s.streak + 1 : Math.max(0, s.streak - 1);
        const newHistory = [...s.history.slice(1), newCompletedToday];
        return { ...s, completedToday: newCompletedToday, streak: newStreak, history: newHistory };
      }
      return s;
    }));
  };

  const addGymEntry = () => {
    const entry: GymEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      type: gymType,
      exercises: exercises.filter(e => e.name.trim())
    };
    setGymEntries(prev => [entry, ...prev]);
    setShowGymForm(false);
    setExercises([{ name: "", sets: 3, reps: 10, weight: 0 }]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Life Tracker
              </h1>
              <div className="flex items-center gap-1 px-3 py-1 bg-orange-500/20 rounded-full">
                <Flame className="h-5 w-5 text-orange-400" />
                <span className="font-bold text-orange-400">{Math.max(...streaks.map(s => s.streak))}</span>
              </div>
              <button 
                onClick={() => setIsAdmin(!isAdmin)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold transition-all",
                  isAdmin ? "bg-green-500 text-white" : "bg-slate-700 text-slate-400"
                )}
              >
                {isAdmin ? "🔧 Admin" : "👤"}
              </button>
            </div>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "overview", icon: "🏠", color: "bg-blue-500", label: "Overview" },
              { key: "streaks", icon: "🔥", color: "bg-orange-500", label: "Streaks" },
              { key: "gym", icon: "💪", color: "bg-red-500", label: "Gym" },
              { key: "projects", icon: "🚀", color: "bg-purple-500", label: "Projects" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                  activeTab === tab.key ? `${tab.color} text-white` : "bg-slate-700/50 text-slate-300"
                )}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Weekly Streak Chart */}
            <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
              <h3 className="font-bold mb-4 flex items-center gap-2">📊 Weekly Consistency</h3>
              <div className="flex justify-between items-end gap-2">
                {streaks[0]?.history.map((done, i) => {
                  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                  const heights = streaks.map(s => s.history[i] ? 100 : 0);
                  const avgHeight = heights.reduce((a: number, b: number) => a + b, 0) / heights.length;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1">
                      <div className="w-full bg-slate-700 rounded-t-lg relative" style={{ height: '80px' }}>
                        <div 
                          className={`absolute bottom-0 w-full rounded-t-lg transition-all ${done ? 'bg-gradient-to-t from-green-500 to-green-400' : 'bg-slate-600'}`}
                          style={{ height: `${avgHeight}%` }}
                        />
                      </div>
                      <span className={`text-xs ${done ? 'text-green-400' : 'text-slate-500'}`}>{dayLabels[i]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex justify-between text-sm">
                <span className="text-slate-400">Wochen-Score: {Math.round((completedToday / streaks.length) * 100)}%</span>
                <span className="text-slate-400">{streaks.filter(s => s.history.every(d => d)).length} / {streaks.length} Habits perfekt</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Flame, color: "from-orange-500 to-red-500", label: "Today", value: `${completedToday}/${streaks.length}`, sub: "done" },
                { icon: Trophy, color: "from-purple-500 to-pink-500", label: "Best Streak", value: Math.max(...streaks.map(s => s.streak)), sub: "days" },
                { icon: Dumbbell, color: "from-red-500 to-orange-500", label: "Workouts", value: gymEntries.length, sub: "logged" },
                { icon: Brain, color: "from-green-500 to-emerald-500", label: "Yoga Übungen", value: 383, sub: "total" },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                  <div className={cn(`bg-gradient-to-r ${stat.color} w-12 h-12 rounded-xl flex items-center justify-center mb-3`)}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Today's Focus */}
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 rounded-2xl p-6 border border-amber-500/30">
              <h3 className="text-xl font-bold mb-4">🚨 Today's Priority</h3>
              <div className="flex gap-2">
                {projects.filter(p => p.priority === "high").map(p => (
                  <span key={p.id} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl font-bold">
                    {p.name}: {p.nextAction}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Streaks */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                <h3 className="font-bold mb-3">🔥 Today's Streaks</h3>
                <div className="space-y-2">
                  {streaks.slice(0,5).map(s => (
                    <div key={s.id} className="flex items-center justify-between">
                      <span className="flex items-center gap-2"><span>{s.icon}</span> {s.name}</span>
                      <button onClick={() => toggleStreak(s.id)} className={cn("px-3 py-1 rounded-full text-sm", s.completedToday ? "bg-green-500 text-white" : "bg-slate-700")}>
                        {s.completedToday ? "✓" : `${s.streak} days`}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                <h3 className="font-bold mb-3">💪 Recent Workouts</h3>
                {gymEntries.length === 0 ? (
                  <p className="text-slate-400">Noch keine Workouts eingetragen</p>
                ) : (
                  <div className="space-y-2">
                    {gymEntries.slice(0,3).map(e => (
                      <div key={e.id} className="flex justify-between text-sm">
                        <span>{e.date} - {e.type}</span>
                        <span className="text-slate-400">{e.exercises.length} Übungen</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Streaks Tab */}
        {activeTab === "streaks" && (
          <div className="space-y-3">
            {streaks.map(streak => (
              <div
                key={streak.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all",
                  streak.completedToday ? "bg-green-500/10 border-green-500/30" : "bg-slate-800/50 border-slate-700/50"
                )}
                onClick={() => toggleStreak(streak.id)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{streak.icon}</span>
                  <div>
                    <p className="font-bold text-lg">{streak.name}</p>
                    <p className="text-xs text-slate-400">
                      {streak.totalExercises ? `${streak.totalExercises} total` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={cn("text-3xl font-bold", streak.completedToday ? "text-green-400" : "text-slate-400")}>{streak.streak}</p>
                    <p className="text-xs text-slate-500">days</p>
                  </div>
                  {streak.completedToday && <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center"><Check className="h-6 w-6" /></div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gym Tab */}
        {activeTab === "gym" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">💪 Gym Workouts</h2>
              {isAdmin && (
                <button 
                  onClick={() => setShowGymForm(!showGymForm)}
                  className="px-4 py-2 bg-red-500 rounded-xl font-bold"
                >
                  + Workout
                </button>
              )}
            </div>

            {showGymForm && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h3 className="font-bold mb-4">Neues Workout eintragen</h3>
                <div className="mb-4">
                  <label className="text-sm text-slate-400">Trainingsart</label>
                  <div className="flex gap-2 mt-2">
                    {(["Push", "Pull", "Leg"] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setGymType(t)}
                        className={cn("px-4 py-2 rounded-xl", gymType === t ? "bg-red-500" : "bg-slate-700")}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {exercises.map((ex, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        placeholder="Übung"
                        className="flex-1 bg-slate-700 rounded-lg px-3 py-2"
                        value={ex.name}
                        onChange={(e) => {
                          const newEx = [...exercises];
                          newEx[i].name = e.target.value;
                          setExercises(newEx);
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Sätze"
                        className="w-16 bg-slate-700 rounded-lg px-2 py-2"
                        value={ex.sets}
                        onChange={(e) => {
                          const newEx = [...exercises];
                          newEx[i].sets = parseInt(e.target.value) || 0;
                          setExercises(newEx);
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Wdh"
                        className="w-16 bg-slate-700 rounded-lg px-2 py-2"
                        value={ex.reps}
                        onChange={(e) => {
                          const newEx = [...exercises];
                          newEx[i].reps = parseInt(e.target.value) || 0;
                          setExercises(newEx);
                        }}
                      />
                      <input
                        type="number"
                        placeholder="KG"
                        className="w-20 bg-slate-700 rounded-lg px-2 py-2"
                        value={ex.weight || ''}
                        onChange={(e) => {
                          const newEx = [...exercises];
                          newEx[i].weight = parseInt(e.target.value) || 0;
                          setExercises(newEx);
                        }}
                      />
                    </div>
                  ))}
                  <button onClick={() => setExercises([...exercises, { name: "", sets: 3, reps: 10, weight: 0 }])} className="text-sm text-slate-400">+ Übung hinzufügen</button>
                </div>
                <button onClick={addGymEntry} className="w-full py-3 bg-green-500 rounded-xl font-bold">Speichern</button>
              </div>
            )}

            {/* Workout History */}
            <div className="space-y-3">
              {gymEntries.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Noch keine Workouts eingetragen</p>
              ) : (
                gymEntries.map(entry => (
                  <div key={entry.id} className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold">{entry.date}</span>
                      <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full">{entry.type} Day</span>
                    </div>
                    <div className="space-y-1">
                      {entry.exercises.map((ex, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{ex.name}</span>
                          <span className="text-slate-400">{ex.sets}x{ex.reps} {ex.weight ? `@ ${ex.weight}kg` : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            {projects.map(project => (
              <div key={project.id} className={cn(
                "p-5 rounded-2xl border",
                project.priority === "high" ? "bg-red-500/10 border-red-500/30" : 
                project.priority === "medium" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-slate-800/50 border-slate-700/50"
              )}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{project.name}</h3>
                    <p className="text-slate-400">{project.description}</p>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-sm",
                    project.status === "active" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                  )}>
                    {project.status}
                  </span>
                </div>
                <p className="mt-2 text-amber-400 text-sm">→ {project.nextAction}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
