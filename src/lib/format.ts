// Мөнгө, огноог монгол хэлбэрээр харуулах туслах функцууд

// 35000 → "35,000₮"  (Android-ийн Hermes дээр toLocaleString найдваргүй тул гараар)
export function money(n: number): string {
  return `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}₮`;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const weekdays = ['Ням', 'Дав', 'Мяг', 'Лха', 'Пүр', 'Баа', 'Бям'];

// "2026-11-10 14:30"
export function dateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// "14:30"
export function hhmm(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Өнөөдрөөс эхлэн N өдрийн жагсаалт (цаг захиалахад өдөр сонгох)
export function nextDays(n: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}
