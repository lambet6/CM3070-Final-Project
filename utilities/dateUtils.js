export function startOfWeek(date = new Date(), weekStartsOnMonday = true) {
    const day = date.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = weekStartsOnMonday ? day - 1 : day; // Adjust if week starts on Monday
    const start = new Date(date);
    start.setDate(date.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  
export function endOfWeek(date = new Date(), weekStartsOnMonday = true) {
  const day = date.getDay();
  const diff = weekStartsOnMonday ? 6 - (day - 1) : 6 - day; // Adjust if Monday-start
  const end = new Date(date);
  end.setDate(date.getDate() + diff);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function generateWeekDays(baseDate = new Date()) {
  const start = startOfWeek(baseDate, { weekStartsOn: 1 }); // Monday
  return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
  });
}