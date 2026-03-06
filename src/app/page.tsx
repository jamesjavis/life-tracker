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
};

type BucketItem = {
  id: string;
  title: string;
  category: string;
  completed: boolean;
};

type GymEntry = {
  id: string;
  date: string;
  exercises: { name: string; sets: number; reps: number; weight?: number }[];
};

type Project = {
  id: string;
  name: string;
  description: string;
  status: "active" | "planning" | "paused" | "done";
  priority: "high" | "medium" | "low";
  category: string;
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

const defaultProjects: Project[] = [
  { id: "1", name: "Benefitsi", description: "FlutterFlow App - Partner-Programm", status: "active", priority: "high", category: "Business", nextAction: "Algolia-Optimierung" },
  { id: "2", name: "eWorld Record", description: "Games auf Abstract blockchain", status: "planning", priority: "medium", category: "Gaming", nextAction: "Konzept erstellen" },
  { id: "3", name: "Abstract Spiel", description: "Eigenes Spiel auf Abstract", status: "planning", priority: "medium", category: "Gaming", nextAction: "Game Design" },
  { id: "4", name: "Preis Arbitrage", description: "Automatisiertes Trading", status: "planning", priority: "low", category: "Finance", nextAction: "Research" },
  { id: "5", name: "Amigo Creator", description: "Creator Trading auf Amigo", status: "active", priority: "high", category: "Finance", nextAction: "Heute launchen!" },
];

export default function LifeTracker() {
  const [streaks, setStreaks] = useState<Streak[]>(initialStreaks);
  const [bucketList, setBucketList] = useState<BucketItem[]>([]);
  const [gymEntries, setGymEntries] = useState<GymEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>(defaultProjects);
  const [activeTab, setActiveTab] = useState<"overview" | "streaks" | "bucket" | "gym" | "projects">("overview");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setStreaks(loadData("life-streaks-v4", initialStreaks));
    setBucketList(loadData("life-bucket-v4", []));
    setGymEntries(loadData("life-gym-v4", []));
    setProjects(loadData("life-projects-v4", defaultProjects));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      saveData("life-streaks-v4", streaks);
      saveData("life-bucket-v4", bucketList);
      saveData("life-gym-v4", gymEntries);
      saveData("life-projects-v4", projects);
    }
  }, [streaks, bucketList, gymEntries, projects, isLoaded]);

  const totalStreakDays = streaks.reduce((sum, s) => sum + s.streak, 0);
  const completedToday = streaks.filter(s => s.completedToday).length;
  const completionRate = Math.round((completedToday / streaks.length) * 100);
  const longestStreak = Math.max(...streaks.map(s => s.bestStreak), 0);

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

  const activeProjects = projects.filter(p => p.status === "active").length;
  const highPriorityProjects = projects.filter(p => p.priority === "high").length;

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
              { key: "projects", icon: "🚀", color: "bg-purple-500", label: "Projects" },
              { key: "gym", icon: "💪", color: "bg-red-500", label: "Gym" },
              { key: "bucket", icon: "🎯", color: "bg-amber-500", label: "Goals" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all transform hover:scale-105",
                  activeTab === tab.key ? `${tab.color} text-white shadow-lg` : "bg-slate-700/50 text-slate-300 hover:bg-slate-600"
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
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Flame, color: "from-orange-500 to-red-500", label: "Today's Progress", value: `${completedToday}/${streaks.length}`, sub: `${completionRate}%` },
                { icon: Rocket, color: "from-purple-500 to-pink-500", label: "Active Projects", value: activeProjects, sub: "in progress" },
                { icon: Trophy, color: "from-yellow-500 to-amber-500", label: "High Priority", value: highPriorityProjects, sub: "focus" },
                { icon: DollarSign, color: "from-green-500 to-emerald-500", label: "Amigo", value: "TODAY!", sub: "launch" },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                  <div className={cn(`bg-gradient-to-r ${stat.color} w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-lg`)}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="text-xs text-slate-500">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Today's Focus */}
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/10 rounded-2xl p-6 border border-amber-500/30">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Rocket className="h-5 w-5 text-amber-400" />
                🚨 Today's Focus
              </h3>
              <div className="space-y-3">
                {projects.filter(p => p.priority === "high").map(project => (
                  <div key={project.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="font-bold">{project.name}</p>
                      <p className="text-sm text-slate-400">{project.description}</p>
                    </div>
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                      {project.nextAction}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Streaks */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-400" />
                  Today's Streaks
                </h3>
                <div className="space-y-2">
                  {streaks.slice(0,4).map(s => (
                    <div key={s.id} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span>{s.icon}</span> {s.name}
                      </span>
                      <button
                        onClick={() => toggleStreak(s.id)}
                        className={cn(
                          "px-3 py-1 rounded-full text-sm",
                          s.completedToday ? "bg-green-500 text-white" : "bg-slate-700 text-slate-400"
                        )}
                      >
                        {s.completedToday ? "✓ Done" : "○ Do it"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-purple-400" />
                  All Projects
                </h3>
                <div className="space-y-2">
                  {projects.map(p => (
                    <div key={p.id} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {p.status === "active" ? "🟢" : p.status === "planning" ? "🟡" : p.status === "done" ? "✅" : "⚪"}
                        {p.name}
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded",
                        p.priority === "high" ? "bg-red-500/20 text-red-400" : 
                        p.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-600"
                      )}>
                        {p.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">All Projects</h2>
              {isAdmin && <button className="px-4 py-2 bg-purple-500 rounded-xl font-bold">+ New Project</button>}
            </div>
            
            {projects.map(project => (
              <div key={project.id} className={cn(
                "p-5 rounded-2xl border",
                project.priority === "high" ? "bg-red-500/10 border-red-500/30" : 
                project.priority === "medium" ? "bg-yellow-500/10 border-yellow-500/30" :
                "bg-slate-800/50 border-slate-700/50"
              )}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-bold">{project.name}</h3>
                    <p className="text-slate-400">{project.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-sm",
                      project.status === "active" ? "bg-green-500/20 text-green-400" :
                      project.status === "planning" ? "bg-yellow-500/20 text-yellow-400" :
                      project.status === "done" ? "bg-blue-500/20 text-blue-400" : "bg-slate-600"
                    )}>
                      {project.status}
                    </span>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-sm",
                      project.priority === "high" ? "bg-red-500/20 text-red-400" :
                      project.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-600"
                    )}>
                      {project.priority}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Next:</span>
                  <span className="text-amber-400 font-bold">{project.nextAction}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Streaks Tab */}
        {activeTab === "streaks" && (
          <div className="space-y-3">
            {streaks.map(streak => (
              <div
                key={streak.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                  streak.completedToday ? "bg-green-500/10 border-green-500/30" : "bg-slate-800/50 border-slate-700/50"
                )}
                onClick={() => toggleStreak(streak.id)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{streak.icon}</span>
                  <div>
                    <p className="font-bold text-lg">{streak.name}</p>
                    <div className="flex gap-1 mt-1">
                      {streak.history.map((done, i) => (
                        <div key={i} className={cn("w-6 h-6 rounded flex items-center justify-center", done ? "bg-green-500/30" : "bg-slate-700")}>
                          {done && <Check className="h-3 w-3" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={cn("text-3xl font-bold", streak.completedToday ? "text-green-400" : "text-slate-400")}>{streak.streak}</p>
                    <p className="text-xs text-slate-500">best: {streak.bestStreak}</p>
                  </div>
                  {streak.completedToday && <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center"><Check className="h-6 w-6" /></div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bucket Tab */}
        {activeTab === "bucket" && (
          <div className="text-center py-12">
            <p className="text-slate-400">Bucket List coming soon...</p>
          </div>
        )}

        {/* Gym Tab */}
        {activeTab === "gym" && (
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: "Push Day", color: "from-red-500 to-orange-500", exercises: ["Bankdrücken", "Schrägbank", "Schulterdrücken", "Trizeps"] },
              { title: "Pull Day", color: "from-blue-500 to-cyan-500", exercises: ["Klimmzüge", "Rudern", "Latzug", "Bizeps"] },
              { title: "Leg Day", color: "from-green-500 to-emerald-500", exercises: ["Kniebeugen", "Beinpresse", "Beinbizeps", "Waden"] },
            ].map((day, i) => (
              <div key={i} className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-r shadow-lg mb-3 flex items-center justify-center", day.color)}>
                  <Dumbbell className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">{day.title}</h3>
                <ul className="space-y-1">
                  {day.exercises.map((ex, j) => <li key={j} className="text-slate-300 text-sm">• {ex}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
