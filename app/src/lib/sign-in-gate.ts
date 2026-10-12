import { router } from 'expo-router';

import { authClient } from '@/lib/auth-client';

// The app opens without an account: reading is for everyone; the profile and writing (posting,
// replying, liking) need one, so these send a signed-out user to the sign-in page instead.

/** The signed-in user's id, or null when nobody is signed in */
export const useSignedInId = (): string | null => authClient.useSession().data?.user.id ?? null;

/** Opens the sign-in page (over the current page: back returns to it) */
export const goToSignIn = () => router.push('/sign-in');
