/**
 * Client-side helper to read user settings from localStorage.
 * Used by all pages to attach API keys to requests.
 */

export function getSettings() {
    if (typeof window === 'undefined') return {};

    return {
        notionKey: localStorage.getItem('notionify_notion_key') || '',
        aiProvider: localStorage.getItem('notionify_ai_provider') || 'gemini',
        aiKey: localStorage.getItem(
            `notionify_ai_key_${localStorage.getItem('notionify_ai_provider') || 'gemini'}`
        ) || '',
    };
}

/**
 * Create headers with API keys for server calls.
 */
export function authHeaders() {
    const settings = getSettings();
    return {
        'Content-Type': 'application/json',
        'x-notion-key': settings.notionKey,
        'x-ai-provider': settings.aiProvider,
        'x-ai-key': settings.aiKey,
    };
}

/**
 * Check if the user has configured their keys.
 */
export function hasNotionKey() {
    return !!getSettings().notionKey;
}

export function hasAiKey() {
    return !!getSettings().aiKey;
}

export function isConfigured() {
    return hasNotionKey() && hasAiKey();
}
