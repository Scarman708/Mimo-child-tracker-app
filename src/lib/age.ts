/** Calendar-based age (years/months/days) from a date-only string 'YYYY-MM-DD'. */
export function parseDateOnly(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function toDateOnly(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function calcAge(birth: string, now = new Date()) {
  const b = parseDateOnly(birth);
  let years = now.getFullYear() - b.getFullYear();
  let months = now.getMonth() - b.getMonth();
  let days = now.getDate() - b.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); // days in previous month
  }
  if (months < 0) { years -= 1; months += 12; }
  return { years, months, days };
}
export function formatAge(birth: string, now = new Date()): string {
  const { years, months, days } = calcAge(birth, now);
  const parts: string[] = [];
  if (years) parts.push(`${years}y`);
  if (months) parts.push(`${months}m`);
  if (!years) parts.push(`${days}d`);
  return parts.join(' ');
}
