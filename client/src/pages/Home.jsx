import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Server, ShieldCheck, ArrowRight, RefreshCw, AlertTriangle, Cpu, Layers } from 'lucide-react';
import { checkServerHealth, SERVER_A_URL, SERVER_B_URL } from '../services/api';

export default function Home() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await checkServerHealth();
      setHealth(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Layers className="text-primary" size={30} style={{ color: 'var(--primary)' }} />
          Mekanisme Fallback (Frontend React JS)
        </h1>
        <p className="page-description">
          Implementasi toleransi kesalahan (fault-tolerance) pada sisi client. Ketika server utama gagal merespons, frontend otomatis mengalihkan permintaan ke server cadangan tanpa mengganggu interaksi pengguna.
        </p>
      </div>

      {/* Live Server Status Overview */}
      <div className="grid-2">
        {/* Server A Card */}
        <div className="card" style={{ borderColor: health?.serverA?.online ? 'var(--server-a-border)' : 'var(--danger-border)' }}>
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Server size={20} style={{ color: 'var(--server-a)' }} />
              <span>Server A (Server Utama)</span>
            </div>
            <span className={`badge ${health?.serverA?.online ? 'badge-server-a' : 'badge-danger'}`}>
              {loading ? 'Memeriksa...' : health?.serverA?.online ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Bertindak sebagai server target primer untuk data kategori. Membaca langsung database <code>db_a</code> dalam format plaintext.
          </p>
          <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)', background: '#0a0f1d', padding: '0.6rem', borderRadius: '6px' }}>
            <div>URL: {SERVER_A_URL}</div>
            <div>Endpoint: GET /api/kategori</div>
            <div>Database: db_a (Plaintext)</div>
          </div>
        </div>

        {/* Server B Card */}
        <div className="card" style={{ borderColor: health?.serverB?.online ? 'var(--server-b-border)' : 'var(--danger-border)' }}>
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={20} style={{ color: 'var(--server-b)' }} />
              <span>Server B (Server Cadangan / Fallback)</span>
            </div>
            <span className={`badge ${health?.serverB?.online ? 'badge-server-b' : 'badge-danger'}`}>
              {loading ? 'Memeriksa...' : health?.serverB?.online ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Bertindak sebagai server failover sekunder. Menyimpan ciphertext AES-256-GCM di <code>db_b</code> dan mendekripsi data saat diakses menggunakan token JWT.
          </p>
          <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-subtle)', background: '#0a0f1d', padding: '0.6rem', borderRadius: '6px' }}>
            <div>URL: {SERVER_B_URL}</div>
            <div>Endpoint: GET /api/kategori (JWT Required)</div>
            <div>Database: db_b (Ciphertext & Decrypt)</div>
          </div>
        </div>
      </div>

      {/* Arsitektur Diagram Box */}
      <div className="card">
        <h3 className="card-title">Alur Kerja Fallback Mechanism</h3>
        <div className="arch-diagram">
          <pre style={{ color: '#93c5fd', fontFamily: 'var(--font-mono)', fontSize: '0.84rem', overflowX: 'auto', lineHeight: '1.7' }}>
{` [ Frontend Client (Port 3000) ]
       │
       ▼  1. Request Utama (timeout: 3000ms)
 [ Server A - Port 3001 ] (db_a: Plaintext)
       │
       ├──► [BERHASIL] ──► Tampilkan data (Sumber data: Server A)
       │
       └──► [GAGAL / TIMEOUT / 5xx] 
              │
              ▼  2. Otomatis Fallback (Login JWT + Request Kategori)
       [ Server B - Port 3002 ] (db_b: Ciphertext AES-256-GCM)
              │
              ├──► [BERHASIL] ──► Dekripsi & Tampilkan data (Sumber data: Server B)
              │
              └──► [GAGAL] ──► Tampilkan Pesan Error: "Kedua server gagal"`}
          </pre>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
        <Link to="/kategori" className="btn btn-primary">
          Uji Halaman Kategori (Dengan Fallback)
          <ArrowRight size={16} />
        </Link>
        <Link to="/kategori-tanpa-fallback" className="btn btn-secondary">
          Bandingkan Versi Tanpa Fallback
        </Link>
        <Link to="/simulator" className="btn btn-outline">
          Buka Panel Simulator Uji
        </Link>
        <button onClick={fetchHealth} className="btn btn-outline" style={{ marginLeft: 'auto' }}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh Status Server
        </button>
      </div>
    </div>
  );
}
