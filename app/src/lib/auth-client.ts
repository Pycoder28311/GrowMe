import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

export const authClient = createAuthClient({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    fetchOptions: { credentials: 'include' }, // web: send the session cookie cross-site
    plugins: [
        expoClient({
            scheme: 'growme',
            storagePrefix: 'growme',
            storage: SecureStore,
        }),
    ],
});
