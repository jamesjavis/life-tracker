import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { berlinDateStr } from "@/lib/date";

const MENTOR_TIPS = [
  // Productivity
  {
    id: "p1",
    category: "productivity",
    emoji: "⚡",
    title: "Eat the Frog First",
    text: "Do your hardest task first thing in the morning. Everything else feels easier after.",
    action: "What's your 'frog' today? Do it before checking your phone.",
  },
  {
    id: "p2",
    category: "productivity",
    emoji: "📋",
    title: "Two-Minute Rule",
    text: "If something takes less than 2 minutes, do it now. Don't let small tasks accumulate.",
    action: "Look at your task list — what's a 2-minute win you can cross off right now?",
  },
  {
    id: "p3",
    category: "productivity",
    emoji: "🎯",
    title: "Single-Tasking Wins",
    text: "Multitasking is a myth. Your brain switches contexts, losing 20-40% efficiency each time.",
    action: "Close all tabs. Pick ONE thing. Focus on it for 25 minutes.",
  },
  {
    id: "p4",
    category: "productivity",
    emoji: "📓",
    title: "Weekly Review Ritual",
    text: "Spend 20 minutes every Sunday reviewing: What worked? What didn't? What's the plan for next week?",
    action: "Block 20 minutes this Sunday for your weekly review.",
  },
  {
    id: "p5",
    category: "productivity",
    emoji: "🌅",
    title: "Morning Routine = Peak Performance",
    text: "How you start your day predicts how you spend it. Protect your morning routine fiercely.",
    action: "What's one thing you can add to your morning to set the tone?",
  },
  // Fitness
  {
    id: "f1",
    category: "fitness",
    emoji: "💪",
    title: "Consistency > Intensity",
    text: "4 gym sessions per week for 10 years beats 6 sessions per week for 1 year and then quitting.",
    action: "Show up. Even on bad days. Especially on bad days.",
  },
  {
    id: "f2",
    category: "fitness",
    emoji: "🏋️",
    title: "Progressive Overload",
    text: "Your body adapts. To keep growing, you need to gradually increase weight, reps, or intensity.",
    action: "Add one rep or 2.5kg to your main lift this week.",
  },
  {
    id: "f3",
    category: "fitness",
    emoji: "🍎",
    title: "Protein Builds Muscle",
    text: "Aim for 1.6-2.2g protein per kg bodyweight. Without it, you're leaving gains on the table.",
    action: `At ${75}kg, you need 120-165g protein daily. That's ~${Math.round(165 / 30)} chicken breasts or 5 scoops of protein powder.`,
  },
  {
    id: "f4",
    category: "fitness",
    emoji: "😴",
    title: "Sleep Is When You Grow",
    text: "Muscle is built during sleep, not during training. 7-9 hours is non-negotiable for results.",
    action: "Track your sleep this week. Are you hitting 8 hours?",
  },
  {
    id: "f5",
    category: "fitness",
    emoji: "🚿",
    title: "Cold Shower Recovery",
    text: "Cold exposure after training reduces inflammation and speeds recovery. 60-90 seconds is enough.",
    action: "End your next shower with 60 seconds cold. Non-negotiable.",
  },
  {
    id: "f6",
    category: "fitness",
    emoji: "📈",
    title: "Track Everything",
    text: "What gets measured gets improved. Log your workouts, weight, and reps consistently.",
    action: "Log your gym session in Life Tracker right now.",
  },
  // Finance
  {
    id: "m1",
    category: "finance",
    emoji: "💰",
    title: "Pay Yourself First",
    text: "Save 20% of every income before spending on anything else. Automation makes this effortless.",
    action: "Set up automatic savings transfer the day you receive money.",
  },
  {
    id: "m2",
    category: "finance",
    emoji: "📊",
    title: "Track Every Euro",
    text: "You can't optimize what you don't measure. Know exactly where your money goes.",
    action: "Log all expenses in Life Tracker finance module today.",
  },
  {
    id: "m3",
    category: "finance",
    emoji: "🎯",
    title: "FI Number Calculation",
    text: "FI = Annual Expenses × 25. At 4% safe withdrawal rate. If you spend €24K/year, you need €600K.",
    action: `Your €1,000/mo = €12K/year. FI number = €300K. You're ${Math.round((2000 + 10000) / 300000 * 100)}% there.`,
  },
  {
    id: "m4",
    category: "finance",
    emoji: "⚡",
    title: "Low-Cost Index Funds",
    text: "Don't pick stocks. Don't time the market. Low-cost index funds beat most professional investors long-term.",
    action: "If investing, use a broker with €0 fees and buy VWCE or similar.",
  },
  {
    id: "m5",
    category: "finance",
    emoji: "🔒",
    title: "Emergency Fund First",
    text: "Before investing, build 3-6 months of expenses as cash. This is your financial airbag.",
    action: `You need €3,000-€6,000 liquid. Current savings: €2,000. Priority #1.`,
  },
  // Mindset
  {
    id: "s1",
    category: "mindset",
    emoji: "🧠",
    title: "Identity-Based Habits",
    text: "Don't say 'I want to exercise.' Say 'I'm an athlete.' Your identity shapes your actions.",
    action: "What identity do you want to build? Anchor one habit to it today.",
  },
  {
    id: "s2",
    category: "mindset",
    emoji: "🔥",
    title: "Streaks Are Your Engine",
    text: "Streaks create momentum. The harder part isn't starting — it's not breaking the chain.",
    action: "Don't break your streak today. No matter what.",
  },
  {
    id: "s3",
    category: "mindset",
    emoji: "🌱",
    title: "Kaizen: 1% Better",
    text: "1% worse every day = nearly zero in a year. 1% better every day = 37× better in a year.",
    action: "What's ONE thing you can improve by 1% today?",
  },
  {
    id: "s4",
    category: "mindset",
    emoji: "⏳",
    title: "Patience Is a Superpower",
    text: "Most people overestimate what they can do in a day. And underestimate what they can do in 10 years.",
    action: "Think 10 years ahead. What does the version of you who wins look like?",
  },
  {
    id: "s5",
    category: "mindset",
    emoji: "🎯",
    title: "Clarity Comes from Action",
    text: "You don't find your purpose by thinking. You find it by doing difficult things.",
    action: "Pick the scariest project on your list. Start it today.",
  },
  // Health
  {
    id: "h1",
    category: "health",
    emoji: "☀️",
    title: "Morning Sunlight",
    text: "Get 10-15 minutes of direct sunlight before 10 AM. It regulates cortisol and melatonin.",
    action: "Step outside right now if it's daytime. Your circadian rhythm will thank you.",
  },
  {
    id: "h2",
    category: "health",
    emoji: "🧘",
    title: "Meditation Builds Discipline",
    text: "10 minutes of meditation daily is like going to the gym for your focus muscle.",
    action: "Even 5 minutes counts. Just sit, breathe, and observe thoughts.",
  },
  {
    id: "h3",
    category: "health",
    emoji: "💧",
    title: "Hydration First",
    text: "Most people walk around mildly dehydrated. Drink a large glass of water first thing.",
    action: "Before coffee — one big glass of water.",
  },
  {
    id: "h4",
    category: "health",
    emoji: "🍽️",
    title: "Eat Real Food",
    text: "If it has an ingredient list, it's probably processed. Single-ingredient foods = your default.",
    action: "One meal today: just real, unprocessed food.",
  },
  {
    id: "h5",
    category: "health",
    emoji: "📵",
    title: "Screen Time Kills Sleep",
    text: "Blue light suppresses melatonin by up to 50%. No screens 60 min before bed = better sleep.",
    action: "Phone outside bedroom. Non-negotiable.",
  },
  // Crypto / Trading
  {
    id: "c1",
    category: "crypto",
    emoji: "📈",
    title: "Dollar-Cost Averaging",
    text: "Invest a fixed amount monthly regardless of price. Removes emotion and timing risk.",
    action: "Set a monthly recurring buy for a fixed amount you won't touch.",
  },
  {
    id: "c2",
    category: "crypto",
    emoji: "🧊",
    title: "Only Play with House Money",
    text: "Never invest more than you can afford to lose entirely. Crypto is still high-risk.",
    action: "Calculate your real risk tolerance. Adjust position size accordingly.",
  },
  {
    id: "c3",
    category: "crypto",
    emoji: "⏰",
    title: "Time in Market > Timing Market",
    text: "The best time to invest was yesterday. The second best time is now. Stop waiting.",
    action: "If you believe in the long-term thesis, stop waiting for a 'better' entry.",
  },
];

export async function GET() {
  // Load real weight from storage for personalized mentor tips
  let weightKg = 75;
  try {
    const weightData = await storage.get("weight");
    const entries = weightData?.entries || [];
    if (entries.length > 0) {
      const last = entries[entries.length - 1];
      weightKg = last.weight ?? 75;
    }
  } catch { /* keep default */ }

  // Rotate tip based on day of year (0-365)
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const tipIndex = dayOfYear % MENTOR_TIPS.length;
  const todayTip = MENTOR_TIPS[tipIndex];

  // Get past 7 days of tips
  const pastTips = [];
  for (let i = 1; i <= 7; i++) {
    const pastIndex = ((dayOfYear - i) + MENTOR_TIPS.length) % MENTOR_TIPS.length;
    pastTips.push({ ...MENTOR_TIPS[pastIndex], daysAgo: i });
  }

  // Override personalized tips with real data
  const proteinLow = Math.round(weightKg * 1.6);
  const proteinHigh = Math.round(weightKg * 2.2);
  const chickenBreasts = Math.round(proteinHigh / 30);
  const personalizedTip = { ...todayTip, action: `At ${weightKg}kg, you need ${proteinLow}-${proteinHigh}g protein daily. That's ~${chickenBreasts} chicken breasts or 5 scoops of protein powder.` };
  const personalizedPastTips = pastTips.map((t, i) =>
    t.id === "f3" ? { ...t, action: `At ${weightKg}kg, you need ${proteinLow}-${proteinHigh}g protein daily.` } : t
  );

  return NextResponse.json({
    today: {
      ...personalizedTip,
      dayOfYear,
      date: now.toISOString().split("T")[0],
    },
    pastTips: personalizedPastTips,
    totalTips: MENTOR_TIPS.length,
    categories: [...new Set(MENTOR_TIPS.map(t => t.category))],
  });
}
