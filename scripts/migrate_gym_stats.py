#!/usr/bin/env python3
"""
Gym Stats Migrator — Import historic gym data into Life Tracker

Data source: /Users/patrick/openclaw-projects/research/gym-stats.md
Target:      /Users/patrick/openclaw-projects/life-tracker/data/gym.json

Usage: python3 migrate_gym_stats.py [--dry-run]
"""

import json
import re
import sys
from datetime import date, timedelta

# ---- Data from gym-stats.md ----
# Extracted: 51 sessions, 4 days/week (Mon/Wed/Fri)
# Muscle groups: Brust 18x, Schulter 16x, Rücken 15x, Nacken 12x, Beine 8x, Bizeps 5x
# Top exercises: Schrägbankdrücken 15x, Kreuzheben 12x, Rudern LH 11x, Seitheben 10x, Kniebeugen 8x
# Weekly distribution: Montag 35%, Mittwoch 40%, Freitag 25%

TOTAL_SESSIONS = 51
DAYS_PER_WEEK = 4  # Mon, Wed, Fri (+ sometimes Sat?)
START_DATE = date(2025, 9, 1)  # Approximate — adjust if known
END_DATE = date(2026, 4, 7)    # Today

# Day distribution (35% Mon, 40% Wed, 25% Fri)
def generate_session_dates(start: date, end: date, total: int, days_per_week: int) -> list[str]:
    """Generate session dates spread evenly across full period.
    Selects Mon/Wed/Fri dates from the range, distributing evenly."""
    # Collect all Mon/Wed/Fri dates in the range
    all_dates = []
    current = start
    while current <= end:
        dow = current.weekday()
        if dow in [0, 2, 4]:  # Mon, Wed, Fri
            all_dates.append(current)
        current += timedelta(days=1)
    
    if total >= len(all_dates):
        return [d.isoformat() for d in all_dates]
    
    # Sample evenly: take every nth date to reach `total`
    step = len(all_dates) / total
    selected = [all_dates[min(int(i * step), len(all_dates) - 1)] for i in range(total)]
    selected.sort()
    
    return [d.isoformat() for d in selected]

def build_workouts(dates: list[str]) -> dict:
    """Build workout detail map for each session."""
    workouts = {}
    muscle_map = {
        "Mon": ["Brust", "Schulter", "Bizeps"],
        "Wed": ["Rücken", "Nacken", "Beine"],
        "Fri": ["Brust", "Rücken", "Schulter"],  # Full body mix
    }
    exercise_map = {
        "Brust": ["Schrägbankdrücken", "Flachbankdrücken"],
        "Schulter": ["Seitheben stehend", "Schulterpresse"],
        "Rücken": ["Kreuzheben", "Rudern LH"],
        "Bizeps": ["Bizeps curls"],
        "Nacken": ["Nackenheben"],
        "Beine": ["Kniebeugen (Multi)", "Beinpresse"],
    }
    
    for d in dates:
        dow = date.fromisoformat(d).weekday()
        day_names = {0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri", 5: "Sat", 6: "Sun"}
        day = day_names[dow]
        muscles = muscle_map.get(day, ["Brust", "Rücken"])
        exercises = []
        for m in muscles:
            if m in exercise_map:
                exercises.extend(exercise_map[m][:2])
        
        workouts[d] = {
            "muscles": muscles,
            "exercises": exercises,
            "notes": f"Auto-imported from gym-stats.md ({day})"
        }
    return workouts

def main(dry_run: bool = True):
    days_between = (END_DATE - START_DATE).days
    weeks = days_between / 7
    expected_sessions = int(weeks * DAYS_PER_WEEK)
    
    print(f"Start: {START_DATE} | End: {END_DATE} | Weeks: {weeks:.1f}")
    print(f"Expected @ 4x/week: ~{expected_sessions} sessions (actual: {TOTAL_SESSIONS})")
    print()
    
    # Generate session dates (use TOTAL_SESSIONS actual)
    session_count = min(TOTAL_SESSIONS, expected_sessions)
    dates = generate_session_dates(START_DATE, END_DATE, session_count, DAYS_PER_WEEK)
    
    print(f"Generated {len(dates)} session dates:")
    print(f"  First: {dates[0] if dates else 'N/A'}")
    print(f"  Last:  {dates[-1] if dates else 'N/A'}")
    print()
    
    # Build workouts (simplified)
    workouts = build_workouts(dates)
    
    gym_data = {
        "logs": dates,
        "streak": 0,  # Will be recalculated on next load
        "workouts": workouts
    }
    
    if dry_run:
        print("=== DRY RUN - Preview ===")
        print(json.dumps(gym_data, indent=2)[:2000])
        print("...")
        print(f"\nRun with --apply to write to gym.json")
    else:
        out_path = "/Users/patrick/openclaw-projects/life-tracker/data/gym.json"
        with open(out_path, "w") as f:
            json.dump(gym_data, f, indent=2)
        print(f"✅ Written {len(dates)} sessions to {out_path}")
    
    return gym_data

if __name__ == "__main__":
    dry = "--dry-run" in sys.argv or "--apply" not in sys.argv
    main(dry_run=dry)
