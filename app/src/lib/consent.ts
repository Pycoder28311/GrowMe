import { Platform } from 'react-native';
import { useSyncExternalStore } from 'react';

/** Bump this when your cookie policy changes: everyone is asked again */
export const CONSENT_VERSION = 1;
const STORAGE_KEY = 'growme-consent';

export type Consent = {
    necessary: true;
    analytics: boolean;
    marketing: boolean;
    version: number;
    updatedAt: string;
};

type State = { consent: Consent | null; settingsOpen: boolean };

const listeners = new Set<() => void>();
let state: State | undefined;

function load(): Consent | null {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Consent | null;
        return saved?.version === CONSENT_VERSION ? saved : null;
    } catch {
        return null; // storage blocked or corrupted: ask again
    }
}

function getState(): State {
    state ??= { consent: Platform.OS === 'web' ? load() : null, settingsOpen: false };
    return state;
}

function update(next: Partial<State>) {
    state = { ...getState(), ...next };
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** undefined = not known yet (server render), otherwise the current state */
export function useConsentState(): State | undefined {
    return useSyncExternalStore(subscribe, getState, () => undefined);
}

export function saveConsent(choice: { analytics: boolean; marketing: boolean }) {
    const consent: Consent = {
        necessary: true,
        ...choice,
        version: CONSENT_VERSION,
        updatedAt: new Date().toISOString(),
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch {
        // storage unavailable: the choice still applies for this visit
    }
    update({ consent, settingsOpen: false });
}

export const openCookieSettings = () => update({ settingsOpen: true });
