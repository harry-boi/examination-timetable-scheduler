/**
 * Utility functions for examination periods and time formatting
 * Standard Polytechnic periods:
 * - Morning Period: 09:00 - 12:00 (9:00 AM - 12:00 PM)
 * - Afternoon Period: 13:00 - 16:00 (1:00 PM - 4:00 PM)
 */

export function formatTime12h(timeStr) {
  if (!timeStr) return "";
  const parts = String(timeStr).split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "PM" : "AM";

  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours -= 12;
  }

  return `${hours}:${minutes} ${ampm}`;
}

export function formatPeriodRange(startTime, endTime) {
  const start12 = formatTime12h(startTime);
  const end12 = formatTime12h(endTime);
  return `${start12} – ${end12}`;
}

export function getExamPeriod(startTime) {
  if (!startTime) return { name: "Unspecified", isMorning: false, icon: "⏱️" };

  const startHour = parseInt(String(startTime).split(":")[0], 10);

  if (startHour < 12) {
    return {
      name: "Morning Paper",
      session: "Morning",
      icon: "☀️",
      badgeClass: "bg-amber-50 text-amber-950 border border-amber-200/90",
      printTag: "MORNING",
    };
  } else {
    return {
      name: "Afternoon Paper",
      session: "Afternoon",
      icon: "🌤️",
      badgeClass: "bg-indigo-50 text-indigo-950 border border-indigo-200/90",
      printTag: "AFTERNOON",
    };
  }
}
