'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { authHeaders } from '@/lib/settings';

const STEPS = [
    { label: 'Name & Database', icon: '📝' },
    { label: 'Review Schema', icon: '🔍' },
    { label: 'Mapping Logic', icon: '🗺️' },
    { label: 'Save', icon: '✅' },
];

export default function NewTransfer() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [name, setName] = useState('');
    const [databaseId, setDatabaseId] = useState('');
    const [schema, setSchema] = useState(null);
    const [databaseName, setDatabaseName] = useState('');
    const [inputDescription, setInputDescription] = useState('');
    const [mappingPrompt, setMappingPrompt] = useState('');
    const [generatingMapping, setGeneratingMapping] = useState(false);

    // Auto-generate mapping when entering step 2
    useEffect(() => {
        if (step === 2 && !mappingPrompt && !generatingMapping) {
            generateMapping();
        }
    }, [step]);

    function parseDatabaseId(input) {
        const trimmed = input.trim();
        const urlMatch = trimmed.match(/([a-f0-9]{32})/);
        if (urlMatch) return urlMatch[1];
        return trimmed.replace(/-/g, '');
    }

    async function fetchSchema() {
        setLoading(true);
        setError('');
        try {
            const cleanId = parseDatabaseId(databaseId);
            const res = await fetch('/api/notion/schema', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ databaseId: cleanId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSchema(data.properties);
            setDatabaseName(data.title);
            setDatabaseId(cleanId);
            setStep(1);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function generateMapping() {
        setGeneratingMapping(true);
        setError('');
        try {
            const res = await fetch('/api/notion/generate-mapping', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ properties: schema, description: inputDescription || 'general content' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMappingPrompt(data.mappingPrompt);
        } catch (err) {
            setError(err.message);
        } finally {
            setGeneratingMapping(false);
        }
    }

    async function saveTransfer() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/transfers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    notionDatabaseId: databaseId,
                    databaseName,
                    properties: schema,
                    mappingPrompt,
                    inputDescription,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            router.push('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function getPropertyTypeBadgeColor(type) {
        const colors = {
            title: 'badge-blue',
            rich_text: 'badge-default',
            number: 'badge-green',
            select: 'badge-yellow',
            multi_select: 'badge-yellow',
            date: 'badge-red',
            url: 'badge-blue',
            email: 'badge-blue',
            checkbox: 'badge-green',
            phone_number: 'badge-default',
        };
        return colors[type] || 'badge-default';
    }

    return (
        <div className="page-content">
            <motion.div
                className="page-header"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="page-title">New Transfer</h1>
                <p className="page-subtitle">
                    Connect a Notion database and set up your extraction pipeline.
                </p>
            </motion.div>

            {/* Stepper */}
            <div className="stepper">
                {STEPS.map((s, i) => (
                    <div key={i} style={{ display: 'contents' }}>
                        <div className="stepper-step">
                            <div
                                className={`stepper-dot ${i < step ? 'completed' : i === step ? 'active' : 'pending'}`}
                                onClick={() => { if (i < step) setStep(i); }}
                                style={{ cursor: i < step ? 'pointer' : 'default' }}
                            >
                                {i < step ? '✓' : i + 1}
                            </div>
                            <span className={`stepper-label ${i < step ? 'completed' : i === step ? 'active' : 'pending'}`}>
                                {s.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`stepper-line ${i < step ? 'completed' : ''}`} />
                        )}
                    </div>
                ))}
            </div>

            {error && (
                <motion.div
                    className="alert alert-error"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: 'var(--space-6)' }}
                >
                    <span className="alert-icon">⚠️</span>
                    <div>
                        <strong>Error: </strong>
                        {error}
                    </div>
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                {/* Step 0: Name & Database */}
                {step === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                        <div className="bento-card" style={{ padding: 'var(--space-8)', cursor: 'default' }}>
                            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-6)' }}>
                                📝 Name & Connect Database
                            </h2>

                            <div className="form-group">
                                <label className="form-label">Transfer Name</label>
                                <input className="form-input" placeholder="e.g. Job Applications" value={name} onChange={(e) => setName(e.target.value)} />
                                <p className="form-hint">A friendly name for this transfer pipeline.</p>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Notion Database ID</label>
                                <input className="form-input" placeholder="Paste a database ID or URL..." value={databaseId} onChange={(e) => setDatabaseId(e.target.value)} />
                                <p className="form-hint">Find it in the database URL: notion.so/xxxxxxxxx?v=... — the "xxxxxxxxx" part is the ID.</p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                                <button className="btn btn-primary btn-lg" onClick={fetchSchema} disabled={!name.trim() || !databaseId.trim() || loading}>
                                    {loading ? (<><span className="spinner" /> Fetching Schema...</>) : 'Fetch Schema →'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Step 1: Review Schema */}
                {step === 1 && schema && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                        <div className="bento-card" style={{ padding: 'var(--space-8)', cursor: 'default' }}>
                            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                                🔍 Database Schema: {databaseName}
                            </h2>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                                {schema.length} properties found. Review them before continuing.
                            </p>

                            <div className="schema-table">
                                {schema.map((prop, i) => (
                                    <div className="schema-row" key={i}>
                                        <span className="schema-row-name">{prop.name}</span>
                                        <span className={`badge ${getPropertyTypeBadgeColor(prop.type)}`}>{prop.type}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-6)' }}>
                                <button className="btn btn-secondary" onClick={() => setStep(0)}>← Back</button>
                                <button className="btn btn-primary btn-lg" onClick={() => setStep(2)}>
                                    Looks Good →
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Mapping Logic (with optional description) */}
                {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                        <div className="bento-card" style={{ padding: 'var(--space-8)', cursor: 'default' }}>
                            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                                🗺️ AI Mapping Logic
                            </h2>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                                AI generated extraction instructions based on your schema. Review, edit, or regenerate with more context.
                            </p>

                            {generatingMapping ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-8)', justifyContent: 'center' }}>
                                    <span className="spinner spinner-lg" />
                                    <span style={{ color: 'var(--text-secondary)' }}>Generating mapping with AI...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Mapping Instructions</label>
                                        <textarea className="form-textarea" rows={12} value={mappingPrompt} onChange={(e) => setMappingPrompt(e.target.value)} placeholder="Mapping instructions will appear here..." />
                                        <p className="form-hint">These instructions tell AI how to extract each property from your pasted content.</p>
                                    </div>

                                    {/* Optional context for regeneration */}
                                    <details style={{ marginTop: 'var(--space-4)' }}>
                                        <summary style={{ cursor: 'pointer', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                            💡 Add context for better results (optional)
                                        </summary>
                                        <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
                                            <textarea
                                                className="form-textarea"
                                                rows={2}
                                                placeholder="e.g. Job descriptions from LinkedIn, Greenhouse..."
                                                value={inputDescription}
                                                onChange={(e) => setInputDescription(e.target.value)}
                                            />
                                            <p className="form-hint">Describe your typical input so AI can refine the mapping.</p>
                                        </div>
                                    </details>
                                </>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-4)' }}>
                                <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                    <button className="btn btn-secondary" onClick={generateMapping} disabled={generatingMapping}>🔄 Regenerate</button>
                                    <button className="btn btn-primary btn-lg" onClick={() => setStep(3)} disabled={!mappingPrompt.trim() || generatingMapping}>Review & Save →</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Review & Save */}
                {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                        <div className="bento-card" style={{ padding: 'var(--space-8)', cursor: 'default' }}>
                            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-6)' }}>
                                ✅ Review & Save
                            </h2>

                            <div className="review-grid">
                                <div className="review-card">
                                    <div className="review-card-header"><span className="review-card-label">Transfer Name</span></div>
                                    <div className="review-card-value">{name}</div>
                                </div>
                                <div className="review-card">
                                    <div className="review-card-header"><span className="review-card-label">Database</span></div>
                                    <div className="review-card-value">{databaseName}</div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>{schema?.length || 0} properties</div>
                                </div>
                                <div className="review-card">
                                    <div className="review-card-header"><span className="review-card-label">Properties</span></div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                                        {schema?.map((prop, i) => (
                                            <span key={i} className={`badge ${getPropertyTypeBadgeColor(prop.type)}`}>{prop.name}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-8)' }}>
                                <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                                <button className="btn btn-primary btn-lg" onClick={saveTransfer} disabled={loading}>
                                    {loading ? (<><span className="spinner" /> Saving...</>) : '🚀 Save Transfer'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
