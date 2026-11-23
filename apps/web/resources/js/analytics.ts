import '../css/analytics.css';

const choiceKey = 'pixel-survivor.analytics-choice';
const visitorKey = 'pixel-survivor.analytics-visitor';
const ignoredPaths = new Set(['admin', 'api', 'assets', 'build', 'health', 'up', 'storage', 'livewire', 'analytics']);

function readChoice(): string | null {
    try {
        return localStorage.getItem(choiceKey);
    } catch {
        return null;
    }
}

function initializeAnalytics(): void {
    const globalPrivacyControl = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;
    if (navigator.webdriver || globalPrivacyControl || !globalThis.crypto?.randomUUID) {
        return;
    }

    const preferences = document.querySelector<HTMLDetailsElement>('[data-analytics-preferences]');
    const buttons = preferences?.querySelectorAll<HTMLButtonElement>('[data-analytics-choice]');
    let lastTrackedPath: string | null = null;
    let tracking = false;

    function trackPage(): void {
        const path = window.location.pathname.replace(/\/+$/, '') || '/';
        if (path === lastTrackedPath || ignoredPaths.has(path.split('/')[1]) || readChoice() !== 'yes') {
            return;
        }

        try {
            let visitor = localStorage.getItem(visitorKey);
            if (!visitor) {
                visitor = crypto.randomUUID();
                localStorage.setItem(visitorKey, visitor);
            }

            lastTrackedPath = path;
            void fetch('/analytics/page-view', {
                method: 'POST',
                credentials: 'omit',
                referrerPolicy: 'no-referrer',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ event_id: crypto.randomUUID(), visitor_id: visitor }),
                keepalive: true,
            }).catch(() => {});
        } catch {
            // Browsers may block local storage. In that case there is no tracking.
        }
    }

    function restorePage(event: PageTransitionEvent): void {
        if (event.persisted) {
            lastTrackedPath = null;
            trackPage();
        }
    }

    function updateConsent(): void {
        const choice = readChoice();
        buttons?.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.analyticsChoice === choice)));

        if (choice === 'yes' && !tracking) {
            tracking = true;
            document.addEventListener('inertia:navigate', trackPage);
            window.addEventListener('pageshow', restorePage);
            trackPage();
        } else if (choice !== 'yes' && tracking) {
            tracking = false;
            lastTrackedPath = null;
            document.removeEventListener('inertia:navigate', trackPage);
            window.removeEventListener('pageshow', restorePage);
        }
    }

    if (preferences && buttons) {
        preferences.hidden = false;
        preferences.open = readChoice() === null;
        buttons.forEach(button => button.addEventListener('click', () => {
            const choice = button.dataset.analyticsChoice === 'yes' ? 'yes' : 'no';
            try {
                localStorage.setItem(choiceKey, choice);
                if (choice === 'no') {
                    localStorage.removeItem(visitorKey);
                }
            } catch {
                // Without a saved preference the tracking decision remains unchanged.
            }

            updateConsent();
            preferences.open = false;
            preferences.querySelector('summary')?.focus();
        }));
    }

    window.addEventListener('storage', event => {
        if (event.key === choiceKey || event.key === null) {
            updateConsent();
        }
    });
    updateConsent();
}

initializeAnalytics();
