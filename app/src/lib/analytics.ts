/**
 * Analytics wrapper: the rest of the app only calls these functions.
 * Nothing is collected unless the user accepted analytics cookies.
 * When you add a tool (e.g. PostHog), put its calls in the marked places.
 */
let started = false;

export function startAnalytics() {
    if (started) return;
    started = true;
    // e.g. posthog.init('<your key>', { api_host: 'https://eu.i.posthog.com' });
}

export function stopAnalytics() {
    if (!started) return;
    started = false;
    // e.g. posthog.opt_out_capturing(); posthog.reset();
}

/** Record an event, e.g. track('note_created', { images: 2 }). Ignored without consent. */
export function track(event: string, properties?: Record<string, unknown>) {
    if (!started) return;
    // e.g. posthog.capture(event, properties);
    void event;
    void properties;
}
