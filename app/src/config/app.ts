import type { IconName } from '@/components/ui/icon';

export const APP_NAME = 'Grow Here';
export const APP_TAGLINE = 'Βρες τα φυτά που ταιριάζουν στο μπαλκόνι σου!';

export type NavId = 'home' | 'messages' | 'results' | 'wiki' | 'profile';
export type TapAnimation = 'hop' | 'wiggle' | 'flap' | 'spin';

// tapAnimation plays on the icon each time its tab is tapped (see components/layout/bottom-nav.tsx)
export const NAV_ITEMS: { id: NavId; label: string; icon: IconName; tapAnimation: TapAnimation }[] = [
  { id: 'home', label: 'Αρχική', icon: 'home', tapAnimation: 'hop' },
  { id: 'messages', label: 'Μηνύματα', icon: 'messages', tapAnimation: 'wiggle' },
  // In the middle: the plants that match the chosen filters
  { id: 'results', label: 'Αποτελέσματα', icon: 'flower', tapAnimation: 'hop' },
  { id: 'wiki', label: 'Εγκυκλοπαίδεια', icon: 'book', tapAnimation: 'flap' },
  { id: 'profile', label: 'Προφίλ', icon: 'profile', tapAnimation: 'hop' },
];

// "Ακολούθησέ μας" on the home page. Placeholders: replace with the app's real pages.
export const SOCIAL_LINKS = [
  { label: 'Facebook', url: 'https://www.facebook.com' },
  { label: 'Instagram', url: 'https://www.instagram.com' },
];
