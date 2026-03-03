// Get local date string in YYYY-MM-DD format (not UTC)
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse a date string and return a Date object at midnight local time
export function parseLocalDateString(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}
