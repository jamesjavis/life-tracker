"use client";

import { useState } from "react";
import { 
  Rocket, DollarSign, TrendingUp, Target, Zap, Globe, 
  Briefcase, Wallet, ChevronRight, ExternalLink, 
  Activity, Calendar, Award, Gift
} from "lucide-react";
import { cn } from "@/lib/utils";

// Patrick's Financial Data (from memory)
const FINANCES = {
  savings: 2000,
  crypto: 10000,
  monthlyCosts: 1000,
  funding: { status: "pending", amount: 12000, expected: "May/June 2026" }
};

// Patrick's Active Projects
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

// Key Metrics / KPIs
const KPIs = [
  { label: "Sparquote", value: "67%", target: "80%", icon: TrendingUp, color: "from-green-500 to-emerald-500" },
  { label: "Daily Progress", value: "87%", target: "100%", icon: Activity, color: "from-blue-500 to-cyan-500" },
  { label: "Funding Chance", value: "TBD", target: "Mai/Jun", icon: Target, color: "from-purple-500 to-pink-500" },
  { label: "Net Worth", value: "€12K", target: "€50K", icon: Wallet, color: "from-amber-500 to-orange-500" },
];

export default function MissionControl() {
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "finances">("overview");

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

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-white/10 text-center text-white/30 text-sm">
          <p>Mission Control • Patrick Rieder • {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}
