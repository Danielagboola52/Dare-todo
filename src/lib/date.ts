export function todayStr(d: Date = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  
  export function addDays(dateStr: string, n: number) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return todayStr(new Date(y, m - 1, d + n));
  }
  
  export function weekdayLetter(dateStr: string) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return 'SMTWTFS'[new Date(y, m - 1, d).getDay()];
  }