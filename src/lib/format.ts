export type TimeFormat = '12h' | '24h';
export const fmtTime = (iso: string, tf: TimeFormat = '12h') =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: tf === '12h' });
export const fmtDate = (dateOnly: string) => {
  const [y, m, d] = dateOnly.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};
/** "Oct 14, 2:30 PM" */
export const fmtDateTime = (d: Date, tf: TimeFormat = '12h') =>
  `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ` +
  d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: tf === '12h' });
