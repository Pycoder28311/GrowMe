import { useEffect } from 'react';
import { Platform } from 'react-native';

import { startAnalytics, stopAnalytics } from '@/lib/analytics';
import { useConsentState } from '@/lib/consent';

/** Renders nothing: turns analytics on/off whenever the user's cookie choice changes */
export function AnalyticsGate() {
    const state = useConsentState();
    const allowed = Platform.OS === 'web' && state?.consent?.analytics === true;

    useEffect(() => {
        if (allowed) startAnalytics();
        else stopAnalytics();
    }, [allowed]);

    return null;
}
