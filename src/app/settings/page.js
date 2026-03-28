'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const AI_PROVIDERS = [
    { id: 'gemini', name: 'Google Gemini', model: 'gemini-3.1-flash-lite-preview', icon: '✨', color: '#4285F4', docsUrl: 'https://aistudio.google.com/apikey' },
    { id: 'claude', name: 'Anthropic Claude', model: 'claude-sonnet-4-20250514', icon: '🟠', color: '#D97757', docsUrl: 'https://console.anthropic.com/' },
    { id: 'openai', name: 'OpenAI', model: 'gpt-4o', icon: '🟢', color: '#10A37F', docsUrl: 'https://platform.openai.com/api-keys' },
];

export default function Settings() {
    const [notionKey, setNotionKey] = useState('');
    const [aiProvider, setAiProvider] = useState('gemini');
    const [aiKeys, setAiKeys] = useState({ gemini: '', claude: '', openai: '' });
    const [saved, setSaved] = useState(false);
    const [showKeys, setShowKeys] = useState({ notion: false, gemini: false, claude: false, openai: false });

    useEffect(() => {
        // Load from localStorage
        setNotionKey(localStorage.getItem('notionify_notion_key') || '');
        setAiProvider(localStorage.getItem('notionify_ai_provider') || 'gemini');
        setAiKeys({
            gemini: localStorage.getItem('notionify_ai_key_gemini') || '',
            claude: localStorage.getItem('notionify_ai_key_claude') || '',
            openai: localStorage.getItem('notionify_ai_key_openai') || '',
        });
    }, []);

    function handleSave() {
        localStorage.setItem('notionify_notion_key', notionKey);
        localStorage.setItem('notionify_ai_provider', aiProvider);
        localStorage.setItem('notionify_ai_key_gemini', aiKeys.gemini);
        localStorage.setItem('notionify_ai_key_claude', aiKeys.claude);
        localStorage.setItem('notionify_ai_key_openai', aiKeys.openai);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    function toggleShow(key) {
        setShowKeys({ ...showKeys, [key]: !showKeys[key] });
    }

    const activeProvider = AI_PROVIDERS.find((p) => p.id === aiProvider);

    return (
        <div className="page-content">
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">
                    Configure your API keys. All keys are stored locally in your browser — never sent to any third-party server.
                </p>
            </motion.div>

            {/* Success toast */}
            {saved && (
                <motion.div
                    className="alert alert-info"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ marginBottom: 'var(--space-6)' }}
                >
                    <span className="alert-icon">✅</span>
                    <span>Settings saved to your browser.</span>
                </motion.div>
            )}

            {/* Notion API Key */}
            <motion.div
                className="bento-card"
                style={{ cursor: 'default', padding: 'var(--space-8)', marginBottom: 'var(--space-5)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                    <span style={{ fontSize: 'var(--font-size-xl)' }}>📓</span>
                    <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Notion Integration</h2>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Notion API Key</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            className="form-input"
                            type={showKeys.notion ? 'text' : 'password'}
                            placeholder="ntn_xxxxxxxxxxxxxxxxxxxxx"
                            value={notionKey}
                            onChange={(e) => setNotionKey(e.target.value)}
                            style={{ paddingRight: 70 }}
                        />
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => toggleShow('notion')}
                            style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}
                        >
                            {showKeys.notion ? '🙈 Hide' : '👁️ Show'}
                        </button>
                    </div>
                    <p className="form-hint">
                        Create an integration at{' '}
                        <a href="https://www.notion.so/my-integrations" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)' }}>
                            notion.so/my-integrations
                        </a>
                        {' '}and share your database with it.
                    </p>
                </div>
            </motion.div>

            {/* AI Provider Selection */}
            <motion.div
                className="bento-card"
                style={{ cursor: 'default', padding: 'var(--space-8)', marginBottom: 'var(--space-5)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                    <span style={{ fontSize: 'var(--font-size-xl)' }}>🤖</span>
                    <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>AI Provider</h2>
                </div>

                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)' }}>
                    Choose which AI model to use for data extraction. You can switch anytime.
                </p>

                {/* Provider cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                    {AI_PROVIDERS.map((provider) => (
                        <div
                            key={provider.id}
                            onClick={() => setAiProvider(provider.id)}
                            style={{
                                border: aiProvider === provider.id ? `2px solid ${provider.color}` : '1px solid var(--border-default)',
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--space-4)',
                                cursor: 'pointer',
                                background: aiProvider === provider.id ? `${provider.color}08` : 'var(--bg-primary)',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                <span>{provider.icon}</span>
                                <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{provider.name}</span>
                            </div>
                            <span className="badge badge-default" style={{ fontSize: '10px' }}>{provider.model}</span>
                        </div>
                    ))}
                </div>

                {/* API key for selected provider */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{activeProvider?.name} API Key</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            className="form-input"
                            type={showKeys[aiProvider] ? 'text' : 'password'}
                            placeholder={`Enter your ${activeProvider?.name} API key...`}
                            value={aiKeys[aiProvider]}
                            onChange={(e) => setAiKeys({ ...aiKeys, [aiProvider]: e.target.value })}
                            style={{ paddingRight: 70 }}
                        />
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => toggleShow(aiProvider)}
                            style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)' }}
                        >
                            {showKeys[aiProvider] ? '🙈 Hide' : '👁️ Show'}
                        </button>
                    </div>
                    <p className="form-hint">
                        Get your key from{' '}
                        <a href={activeProvider?.docsUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)' }}>
                            {activeProvider?.docsUrl?.replace('https://', '')}
                        </a>
                    </p>
                </div>
            </motion.div>

            {/* Save Button */}
            <motion.div
                style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
            >
                <button className="btn btn-primary btn-lg" onClick={handleSave}>
                    💾 Save Settings
                </button>
            </motion.div>

            {/* Privacy note */}
            <motion.div
                style={{
                    marginTop: 'var(--space-8)',
                    padding: 'var(--space-4) var(--space-5)',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-tertiary)',
                    lineHeight: 1.6,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                🔒 <strong>Privacy:</strong> Your API keys are stored only in your browser&apos;s localStorage and sent directly to the respective APIs (Notion, Google, Anthropic, or OpenAI). They are never stored on any server.
            </motion.div>
        </div>
    );
}
