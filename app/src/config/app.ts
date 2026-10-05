import type { IconName } from '@/components/ui/icon';

export const APP_NAME = 'GrowMe';
export const APP_TAGLINE = 'Βρες τα φυτά που ταιριάζουν στο μπαλκόνι σου!';

export type NavId = 'home' | 'messages' | 'wiki' | 'settings';
export type TapAnimation = 'hop' | 'wiggle' | 'flap' | 'spin';

// tapAnimation plays on the icon each time its tab is tapped (see components/layout/bottom-nav.tsx)
export const NAV_ITEMS: { id: NavId; label: string; icon: IconName; tapAnimation: TapAnimation }[] = [
  { id: 'home', label: 'Αρχική', icon: 'home', tapAnimation: 'hop' },
  { id: 'messages', label: 'Μηνύματα', icon: 'messages', tapAnimation: 'wiggle' },
  { id: 'wiki', label: 'Εγκυκλοπαίδεια', icon: 'book', tapAnimation: 'flap' },
  { id: 'settings', label: 'Ρυθμίσεις', icon: 'settings', tapAnimation: 'spin' },
];
