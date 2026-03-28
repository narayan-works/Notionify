'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const EMOJIS = ['📋', '💼', '📚', '🍳', '👥', '🎯', '🔖', '📁'];

function getEmoji(index) {
  return EMOJIS[index % EMOJIS.length];
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Dashboard() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchTransfers();
  }, []);

  async function fetchTransfers() {
    try {
      const res = await fetch('/api/transfers');
      const data = await res.json();
      setTransfers(data);
    } catch (err) {
      console.error('Failed to load transfers:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await fetch(`/api/transfers/${id}`, { method: 'DELETE' });
      setTransfers(transfers.filter((t) => t.id !== id));
      setDeleteId(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  }

  return (
    <div className="page-content">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="page-title">Transfers</h1>
        <p className="page-subtitle">
          Define once, paste forever. Select a transfer to run it, or create a new one.
        </p>
      </motion.div>

      {loading ? (
        <div className="bento-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bento-card" style={{ minHeight: 200 }}>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8, marginBottom: 16 }} />
              <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '80%', height: 12, marginBottom: 20 }} />
              <div className="skeleton" style={{ width: '40%', height: 10 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bento-grid">
          {/* New Transfer Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/transfers/new" style={{ textDecoration: 'none' }}>
              <div className="bento-card bento-card-new">
                <div className="card-icon">+</div>
                <div className="card-label">New Transfer</div>
              </div>
            </Link>
          </motion.div>

          {/* Transfer Cards */}
          {transfers.map((transfer, index) => (
            <motion.div
              key={transfer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link href={`/transfers/${transfer.id}`} style={{ textDecoration: 'none' }}>
                <div className="bento-card">
                  <div className="transfer-card-header">
                    <div className="transfer-card-emoji">{getEmoji(index)}</div>
                    <button
                      className="transfer-card-menu"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteId(transfer.id);
                      }}
                      title="Delete transfer"
                    >
                      ⋯
                    </button>
                  </div>
                  <div className="transfer-card-name">{transfer.name}</div>
                  <div className="transfer-card-desc">
                    {transfer.inputDescription || transfer.databaseName || 'No description'}
                  </div>
                  <div className="transfer-card-meta">
                    <span className="badge badge-default">
                      {transfer.properties?.length || 0} properties
                    </span>
                    <span className="badge badge-blue">
                      {transfer.runCount || 0} runs
                    </span>
                    {transfer.lastRunAt && (
                      <span className="badge badge-default">
                        {timeAgo(transfer.lastRunAt)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}

          {/* Empty state when no transfers */}
          {transfers.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={{ gridColumn: '1 / -1' }}
            >
              <div className="empty-state">
                <div className="empty-state-icon">🚀</div>
                <h3 className="empty-state-title">No transfers yet</h3>
                <p className="empty-state-desc">
                  Create your first transfer to start automating Notion data entry.
                  Connect a database, describe your data, and let AI handle the rest.
                </p>
                <Link href="/transfers/new">
                  <button className="btn btn-primary btn-lg">Create Your First Transfer</button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">Delete Transfer</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                Are you sure you want to delete this transfer? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
