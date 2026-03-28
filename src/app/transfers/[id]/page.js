'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { authHeaders } from '@/lib/settings';
import { getTransferById, updateTransfer } from '@/lib/transfers';

export default function TransferDetail() {
    const router = useRouter();
    const params = useParams();
    const [transfer, setTransfer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [input, setInput] = useState('');
    const [extracting, setExtracting] = useState(false);
    const [extracted, setExtracted] = useState(null);
    const [editedValues, setEditedValues] = useState({});
    const [writing, setWriting] = useState(false);
    const [result, setResult] = useState(null);
    const [scrapeWarning, setScrapeWarning] = useState('');
    const [checkingDuplicate, setCheckingDuplicate] = useState(false);
    const [duplicateWarning, setDuplicateWarning] = useState(null);
    const [addAnyway, setAddAnyway] = useState(false);

    useEffect(() => { fetchTransfer(); }, []);

    async function fetchTransfer() {
        try {
            const data = getTransferById(params.id);
            if (!data) throw new Error('Transfer not found');
            setTransfer(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleExtract() {
        setExtracting(true);
        setError('');
        setExtracted(null);
        setScrapeWarning('');

        try {
            const res = await fetch('/api/extract', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ transfer, input }),
            });
            const data = await res.json();

            if (!res.ok) {
                if (data.scrapeError) {
                    setScrapeWarning(data.error);
                } else {
                    throw new Error(data.error);
                }
                return;
            }

            setExtracted(data.extracted);
            setEditedValues(data.extracted);
            checkDuplicate(data.extracted);
        } catch (err) {
            setError(err.message);
        } finally {
            setExtracting(false);
        }
    }

    async function checkDuplicate(extractedData) {
        setCheckingDuplicate(true);
        setDuplicateWarning(null);
        setAddAnyway(false);

        try {
            const res = await fetch('/api/check-duplicate', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ databaseId: transfer.notionDatabaseId, extractedData }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.isDuplicate) {
                    setDuplicateWarning(data);
                }
            }
        } catch (err) {
            console.error('Failed to check duplicates:', err);
        } finally {
            setCheckingDuplicate(false);
        }
    }

    async function handleWrite() {
        setWriting(true);
        setError('');

        try {
            const res = await fetch('/api/notion/write', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ 
                    notionDatabaseId: transfer.notionDatabaseId,
                    schema: transfer.properties,
                    properties: editedValues 
                }),
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            
            setResult(data);

            updateTransfer(transfer.id, {
                lastRunAt: new Date().toISOString(),
                runCount: (transfer.runCount || 0) + 1,
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setWriting(false);
        }
    }

    function handleValueChange(key, value) {
        setEditedValues({ ...editedValues, [key]: value });
    }

    function resetRun() {
        setInput('');
        setExtracted(null);
        setEditedValues({});
        setResult(null);
        setError('');
        setScrapeWarning('');
        setDuplicateWarning(null);
        setCheckingDuplicate(false);
        setAddAnyway(false);
    }

    function getPropertyTypeBadgeColor(type) {
        const colors = { title: 'badge-blue', rich_text: 'badge-default', number: 'badge-green', select: 'badge-yellow', multi_select: 'badge-yellow', date: 'badge-red', url: 'badge-blue', email: 'badge-blue', checkbox: 'badge-green' };
        return colors[type] || 'badge-default';
    }

    if (loading) {
        return (
            <div className="page-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-16)', justifyContent: 'center' }}>
                    <span className="spinner spinner-lg" />
                </div>
            </div>
        );
    }

    if (error && !transfer) {
        return (
            <div className="page-content">
                <div className="empty-state">
                    <div className="empty-state-icon">😵</div>
                    <h3 className="empty-state-title">Transfer Not Found</h3>
                    <p className="empty-state-desc">{error}</p>
                    <button className="btn btn-primary" onClick={() => router.push('/')}>Back to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <motion.div className="page-header" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => router.push('/')} style={{ marginLeft: '-8px' }}>← Back</button>
                </div>
                <h1 className="page-title">{transfer.name}</h1>
                <p className="page-subtitle">{transfer.databaseName} · {transfer.properties?.length || 0} properties</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                    {transfer.properties?.map((prop, i) => (
                        <span key={i} className={`badge ${getPropertyTypeBadgeColor(prop.type)}`}>{prop.name}</span>
                    ))}
                </div>
            </motion.div>

            {error && (
                <motion.div className="alert alert-error" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 'var(--space-6)' }}>
                    <span className="alert-icon">⚠️</span>
                    <div><strong>Error: </strong>{error}</div>
                </motion.div>
            )}

            {scrapeWarning && (
                <motion.div className="alert alert-warning" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 'var(--space-6)' }}>
                    <span className="alert-icon">🔗</span>
                    <div><strong>Scraping failed: </strong>{scrapeWarning}</div>
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                {result ? (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                        <div className="success-panel">
                            <div className="success-icon">✓</div>
                            <h2 className="success-title">Written to Notion!</h2>
                            <p className="success-desc">Your data has been added to {transfer.databaseName}.</p>

                            <div className="success-stats">
                                <div className="success-stat">
                                    <div className="success-stat-value">{result.written?.length || 0}</div>
                                    <div className="success-stat-label">Written</div>
                                </div>
                                <div className="success-stat">
                                    <div className="success-stat-value">{result.skipped?.length || 0}</div>
                                    <div className="success-stat-label">Skipped</div>
                                </div>
                            </div>

                            {result.skipped?.length > 0 && (
                                <div style={{ marginTop: 'var(--space-6)', textAlign: 'left', maxWidth: 400, margin: 'var(--space-6) auto 0' }}>
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-2)', fontWeight: 500 }}>SKIPPED PROPERTIES</p>
                                    {result.skipped.map((s, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', fontSize: 'var(--font-size-sm)', borderBottom: '1px solid var(--border-default)' }}>
                                            <span style={{ fontWeight: 500 }}>{s.name}</span>
                                            <span style={{ color: 'var(--text-tertiary)' }}>{s.reason}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginTop: 'var(--space-8)', display: 'flex', justifyContent: 'center', gap: 'var(--space-3)' }}>
                                <button className="btn btn-secondary" onClick={resetRun}>Run Another</button>
                                {result.pageUrl && (
                                    <a href={result.pageUrl} target="_blank" rel="noopener noreferrer">
                                        <button className="btn btn-primary">Open in Notion ↗</button>
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : extracted ? (
                    <motion.div key="review" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
                        <div className="bento-card" style={{ cursor: 'default', padding: 'var(--space-8)' }}>
                            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>📋 Review Extracted Data</h2>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>Review and edit the values before writing to Notion.</p>

                            {checkingDuplicate && (
                                <motion.div className="alert alert-info" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 'var(--space-6)' }}>
                                    <span className="spinner" style={{ borderColor: 'var(--accent-blue)', borderTopColor: 'transparent', width: 16, height: 16 }} />
                                    <div><strong>Checking for duplicates...</strong></div>
                                </motion.div>
                            )}

                            {duplicateWarning && !addAnyway && (
                                <motion.div className="alert alert-warning" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 'var(--space-6)', flexDirection: 'column', gap: 'var(--space-4)' }}>
                                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                        <span className="alert-icon">⚠️</span>
                                        <div>
                                            <strong>{duplicateWarning.matchPercentage || 'High'}% Match Found: </strong>
                                            {duplicateWarning.matchedSummary || 'A very similar entry already exists in your database.'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-3)', paddingLeft: 'calc(var(--space-3) + 20px)' }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => { setExtracted(null); setDuplicateWarning(null); }}>Discard (Leave as is)</button>
                                        <button className="btn btn-primary btn-sm" style={{ background: 'var(--accent-yellow)', color: '#000' }} onClick={() => setAddAnyway(true)}>Add Anyway</button>
                                    </div>
                                </motion.div>
                            )}

                            <div className="review-grid">
                                {transfer.properties?.map((prop, i) => {
                                    const value = editedValues[prop.name];
                                    const isEmpty = value === null || value === undefined || value === '';
                                    return (
                                        <motion.div key={prop.name} className="review-card" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                                            <div className="review-card-header">
                                                <span className="review-card-label">{prop.name}</span>
                                                <span className={`badge ${getPropertyTypeBadgeColor(prop.type)}`}>{prop.type}</span>
                                            </div>
                                            {prop.type === 'checkbox' ? (
                                                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', marginTop: 'var(--space-2)' }}>
                                                    <input type="checkbox" checked={!!value} onChange={(e) => handleValueChange(prop.name, e.target.checked)} />
                                                    <span style={{ fontSize: 'var(--font-size-sm)' }}>{value ? 'Yes' : 'No'}</span>
                                                </label>
                                            ) : (
                                                <input className="review-card-input" value={value || ''} onChange={(e) => handleValueChange(prop.name, e.target.value)} placeholder={isEmpty ? '(not found)' : ''} style={isEmpty ? { color: 'var(--text-tertiary)', fontStyle: 'italic' } : {}} />
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-8)' }}>
                                <button className="btn btn-secondary" onClick={() => { setExtracted(null); setEditedValues({}); setDuplicateWarning(null); }}>← Re-extract</button>
                                <button className="btn btn-primary btn-lg" onClick={handleWrite} disabled={writing || checkingDuplicate || (duplicateWarning && !addAnyway)}>
                                    {writing ? (<><span className="spinner" /> Writing to Notion...</>) : '✅ Write to Notion'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="input" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
                        <div className="bento-card" style={{ cursor: 'default', padding: 'var(--space-8)' }}>
                            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>📥 Paste Your Data</h2>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>Paste a URL to scrape, or raw text to extract from.</p>

                            <textarea className="paste-area" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste a URL or raw text here..." />

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
                                <button className="btn btn-primary btn-lg" onClick={handleExtract} disabled={!input.trim() || extracting}>
                                    {extracting ? (<><span className="spinner" /> Extracting...</>) : '⚡ Extract Data'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
