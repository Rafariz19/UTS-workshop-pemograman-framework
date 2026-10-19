import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Server, Database, ShieldAlert, Cpu, CheckCircle2, XCircle } from 'lucide-react';
import { checkServerHealth } from '../services/api';

export default function Navbar() {
  const [health, setHealth] = useState({
    serverA: { online: false },
    serverB: { online: false }
  });

  const refreshHealth = async () => {
    try {
      const res = await checkServerHealth();
      setHealth(res);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <NavLink to="/" className="navbar-brand">
          <div className="brand-icon">
            <Cpu size={20} />
          </div>
          <div className="brand-text">
            <h1>Fallback Mechanism</h1>
            <p>Frontend React JS • Port 3000</p>
          </div>
        </NavLink>

        <ul className="nav-links">
          <li>
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/kategori" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Kategori
              <span className="nav-badge-pill pill-green">Fallback</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/kategori-tanpa-fallback" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Kategori (Tanpa Fallback)
              <span className="nav-badge-pill pill-orange">Non-FB</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/produk" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Produk
            </NavLink>
          </li>
          <li>
            <NavLink to="/simulator" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <ShieldAlert size={15} />
              Simulator Uji
            </NavLink>
          </li>
        </ul>

        {/* Live Status Server A & B Mini Pills */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <div
            title={`Server A (3001): ${health.serverA.online ? 'Online' : 'Offline'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 600,
              background: health.serverA.online ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: health.serverA.online ? '#10b981' : '#ef4444',
              border: `1px solid ${health.serverA.online ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}
          >
            {health.serverA.online ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
            Server A: {health.serverA.online ? '3001' : 'Off'}
          </div>

          <div
            title={`Server B (3002): ${health.serverB.online ? 'Online' : 'Offline'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 600,
              background: health.serverB.online ? 'rgba(139, 92, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: health.serverB.online ? '#8b5cf6' : '#ef4444',
              border: `1px solid ${health.serverB.online ? 'rgba(139, 92, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}
          >
            {health.serverB.online ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
            Server B: {health.serverB.online ? '3002' : 'Off'}
          </div>
        </div>
      </div>
    </nav>
  );
}
