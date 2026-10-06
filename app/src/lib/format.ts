/** "Μόλις τώρα", "5 λεπτά πριν", "3 ώρες πριν", "2 ημέρες πριν", then the date ("12 Μαΐου 2026") */
export function timeAgo(iso: string, now = Date.now()) {
  const seconds = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return 'Μόλις τώρα';
  if (minutes < 60) return minutes === 1 ? '1 λεπτό πριν' : `${minutes} λεπτά πριν`;
  if (hours < 24) return hours === 1 ? '1 ώρα πριν' : `${hours} ώρες πριν`;
  if (days < 7) return days === 1 ? '1 ημέρα πριν' : `${days} ημέρες πριν`;
  return new Date(iso).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' });
}
