'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './globals.css';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <title>Notionify — Automate Notion Data Entry</title>
        <meta name="description" content="Eliminate manual Notion data entry. Define a transfer once, paste data, and let AI do the rest." />
      </head>
      <body>
        {/* Mobile Header */}
        <div className="mobile-header">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <span className="mobile-header-title">Notionify</span>
          <div style={{ width: 36 }} />
        </div>

        {/* Overlay */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        <div className="app-shell">
          {/* Sidebar */}
          <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-brand">
              <div className="sidebar-logo">nf</div>
              <span className="sidebar-title">Notionify</span>
            </div>

            <nav className="sidebar-nav">
              <Link
                href="/"
                className={`sidebar-link ${pathname === '/' ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sidebar-link-icon">🏠</span>
                Dashboard
              </Link>

              <Link
                href="/transfers/new"
                className={`sidebar-link ${pathname === '/transfers/new' ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sidebar-link-icon">✨</span>
                New Transfer
              </Link>

              <Link
                href="/settings"
                className={`sidebar-link ${pathname === '/settings' ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sidebar-link-icon">⚙️</span>
                Settings
              </Link>
            </nav>

            <div className="sidebar-section-title">Quick Tips</div>
            <div style={{
              padding: 'var(--space-3)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-tertiary)',
              lineHeight: '1.6'
            }}>
              Go to Settings to add your Notion and AI API keys. Your keys stay in your browser.
            </div>
          </aside>

          {/* Main Content */}
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
