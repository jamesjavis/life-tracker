import { NextResponse } from "next/server";

function getWeatherIcon(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes("rain") || c.includes("drizzle")) return "CloudRain";
  if (c.includes("snow") || c.includes("sleet")) return "CloudSnow";
  if (c.includes("thunder") || c.includes("lightning")) return "CloudLightning";
  if (c.includes("cloud") || c.includes("overcast")) return "Cloud";
  if (c.includes("sun") || c.includes("clear")) return "Sun";
  if (c.includes("wind")) return "Wind";
  return "Cloud";
}

export async function GET() {
  try {
    const res = await fetch("https://wttr.in/Annweiler?format=j1", {
      next: { revalidate: 900 } // cache 15 min
    });
    
    if (!res.ok) throw new Error("wttr.in failed");
    
    const data = await res.json();
    const current = data.current_condition?.[0];
    const weatherData = data.weather || [];

    const currentWeather = current ? {
      temp: parseInt(current.temp_C) || 0,
      feels: parseInt(current.FeelsLikeC) || 0,
      condition: current.weatherDesc?.[0]?.value || "Unknown",
      humidity: parseInt(current.humidity) || 0,
      wind: parseInt(current.windspeedKmph) || 0,
      icon: getWeatherIcon(current.weatherDesc?.[0]?.value || "")
    } : null;

    const forecastData = weatherData.slice(0, 4).map((day: any) => ({
      date: day.date,
      min: parseInt(day.mintempC) || 0,
      max: parseInt(day.maxtempC) || 0,
      condition: day.hourly?.[4]?.weatherDesc?.[0]?.value || "Unknown",
      icon: getWeatherIcon(day.hourly?.[4]?.weatherDesc?.[0]?.value || "")
    }));

    return NextResponse.json({ current: currentWeather, forecast: forecastData });
  } catch (e) {
    console.error("Weather API error:", e);
    return NextResponse.json({ 
      current: { temp: 5, feels: 2, condition: "Light rain", humidity: 70, wind: 21, icon: "CloudRain" },
      forecast: [
        { date: "2026-03-30", min: 2, max: 8, condition: "Patchy rain nearby", icon: "CloudRain" },
        { date: "2026-03-31", min: -1, max: 7, condition: "Light sleet", icon: "CloudSnow" },
        { date: "2026-04-01", min: 1, max: 7, condition: "Patchy rain nearby", icon: "CloudRain" },
      ]
    });
  }
}