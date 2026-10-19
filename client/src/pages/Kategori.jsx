import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Server, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Terminal, 
  Code2, 
  SlidersHorizontal 
} from 'lucide-react';
import { 
  getKategoriNestedCatch, 
  getKategoriAsyncLoop, 
  SERVER_A_URL, 
  SERVER_B_URL, 
  TIMEOUT_MS 
} from '../services/api';

/**
 * Komponen Kategori DENGAN Mekanisme Fallback
 * Mengimplementasikan:
 * 1. Mode Nested Catch (sesuai modul) vs Mode Async/Await Loop (Enhanced Extensible).
 * 2. Timeout 3000ms pada axios.
 * 3. Autentikasi otomatis JWT ke Server B.
 * 4. Penanganan 401 (re-login 1x).
 * 5. Penanganan res.data.status === false.
 * 6. Visual badge dan teks: "Sumber data: Server A" atau "Server B".
 * 7. Live Activity Timeline / Log HTTP.
 */
export default function Kategori() {
  const [kategori, setKategori] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sumberData, setSumberData] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [fallbackReason, setFallbackReason] = useState(null);
  const [durasi, setDurasi] = useState(0);
  const [errorFinal, setErrorFinal] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  
  // State pilihan metode: 'nested' (Modul) atau 'async-loop' (Enhanced)
  const [metode, setMetode] = useState('nested');

  const fetchData = async () => {
    setLoading(true);
    setErrorFinal(null);
    setSumberData(null);
    setIsFallback(false);
    setFallbackReason(null);

    try {
      let result;
      if (metode === 'nested') {
        // Pola 1: Nested Catch (Sesuai Konsep Modul)
        result = await getKategoriNestedCatch();
      } else {
        // Pola 2: Async/Await Loop (Enhanced Multi-Server)
        result = await getKategoriAsyncLoop();
      }

      setKategori(result.data);
      setSumberData(result.sumber);
      setIsFallback(result.isFallback);
      setFallbackReason(result.fallbackReason);
      setDurasi(result.durasi);
      setActivityLogs(result.logs || []);
    } catch (err) {
      console.error('Kedua server gagal:', err);
      setErrorFinal('Kedua server gagal merespons permintaan data kategori.');
      setActivityLogs(err.logs || [`[${new Date().toLocaleTimeString()}] Fatal: Kedua server gagal dihubungi.`]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [metode]);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">
              Data Kategori
              <span className="badge badge-server-a">Fallback Mechanism Aktif</span>
            </h1>
            <p className="page-description">
              Mencoba menghubungi Server A terlebih dahulu ({TIMEOUT_MS}ms timeout). Jika gagal, otomatis dialihkan ke Server B (JWT + Dekripsi AES-256-GCM).
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={fetchData} className="btn btn-primary" disabled={loading}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Muat Ulang
            </button>
          </div>
        </div>
      </div>

      {/* Mode Selector Tab (Nested Catch vs Async Loop) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="mode-tabs">
          <button 
            className={`tab-btn ${metode === 'nested' ? 'active' : ''}`}
            onClick={() => setMetode('nested')}
          >
            Metode Nested Catch (Modul)
          </button>
          <button 
            className={`tab-btn ${metode === 'async-loop' ? 'active' : ''}`}
            onClick={() => setMetode('async-loop')}
          >
            Metode Async/Await Loop (Enhanced)
          </button>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Metode aktif: <strong style={{ color: 'var(--primary)' }}>{metode === 'nested' ? 'Promise .catch() Bersarang' : 'Iterasi Array Server [A, B]'}</strong>
        </div>
      </div>

      {/* Status Banner Dinamis */}
      {!loading && sumberData && !isFallback && (
        <div className="status-banner banner-server-a">
          <div className="status-banner-left">
            <span className="status-indicator-dot dot-green dot-pulsing"></span>
            <div>
              <strong style={{ fontSize: '0.98rem' }}>Sumber data: {sumberData}</strong>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                Server utama (Port 3001) sehat dan merespons dalam {durasi}ms. Mekanisme fallback dalam status siaga.
              </div>
            </div>
          </div>
          <span className="badge badge-server-a">
            <CheckCircle2 size={13} />
            Server Utama (db_a Plaintext)
          </span>
        </div>
      )}

      {!loading && sumberData && isFallback && (
        <div className="status-banner banner-server-b">
          <div className="status-banner-left">
            <span className="status-indicator-dot dot-purple dot-pulsing"></span>
            <div>
              <strong style={{ fontSize: '0.98rem' }}>Sumber data: {sumberData} (Mekanisme Fallback Aktif)</strong>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                Alasan: {fallbackReason || 'Server A tidak merespons'}. Frontend otomatis mengambil data dari Server B (Port 3002) via JWT & dekripsi AES-256-GCM ({durasi}ms).
              </div>
            </div>
          </div>
          <span className="badge badge-server-b">
            <ShieldCheck size={13} />
            Server Cadangan (db_b Decrypted)
          </span>
        </div>
      )}

      {!loading && errorFinal && (
        <div className="status-banner banner-danger">
          <div className="status-banner-left">
            <span className="status-indicator-dot dot-red"></span>
            <div>
              <strong style={{ fontSize: '0.98rem' }}>Error: {errorFinal}</strong>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                Server A dan Server B keduanya tidak dapat dihubungi atau mengalami kegagalan. Silakan periksa status koneksi jaringan dan kedua server backend.
              </div>
            </div>
          </div>
          <span className="badge badge-danger">
            <AlertTriangle size={13} />
            Kedua Server Gagal
          </span>
        </div>
      )}

      {/* Main Content Grid: Tabel & Live Log */}
      <div className="grid-2">
        {/* Kolom Kiri: Tabel Data Kategori */}
        <div className="card">
          <div className="card-title">
            <span>Data Kategori</span>
            {sumberData && (
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Sumber data: <strong style={{ color: isFallback ? 'var(--server-b)' : 'var(--server-a)' }}>{sumberData}</strong>
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem', color: 'var(--primary)' }} />
              <p style={{ fontWeight: 600 }}>Menjalankan permintaan data kategori...</p>
              <p style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>Menguji Server A (timeout {TIMEOUT_MS}ms) dengan fallback otomatis ke Server B</p>
            </div>
          ) : kategori.length > 0 ? (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th className="col-number">#</th>
                    <th>Nama</th>
                  </tr>
                </thead>
                <tbody>
                  {kategori.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="col-number">{index + 1}</td>
                      <td style={{ fontWeight: 600 }}>{item.nama_kategori}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <AlertTriangle size={32} style={{ color: 'var(--danger)', margin: '0 auto 0.5rem' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>Data Kategori Kosong</p>
              <p style={{ fontSize: '0.84rem' }}>Kedua server gagal merespons permintaan.</p>
            </div>
          )}

          {/* Footer Info Tabel */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
            <span>Total baris: <strong>{kategori.length}</strong></span>
            {durasi > 0 && <span>Waktu respons total: <strong>{durasi}ms</strong></span>}
          </div>
        </div>

        {/* Kolom Kanan: Log Aktivitas Request & Fallback Timeline */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Terminal size={18} style={{ color: 'var(--primary)' }} />
              <span>Log Alur Fallback (Real-Time Trace)</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
              Timeout: {TIMEOUT_MS}ms
            </span>
          </div>

          <div className="log-box" style={{ minHeight: '190px' }}>
            {activityLogs.length > 0 ? (
              activityLogs.map((log, idx) => (
                <div key={idx} className="log-entry">
                  {log}
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                Belum ada aktivitas terekam. Klik tombol "Muat Ulang" untuk melihat trace.
              </div>
            )}
          </div>

          {/* Arsitektur Info Box */}
          <div style={{ marginTop: '1.25rem', padding: '0.9rem', borderRadius: '8px', background: '#0d1424', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '0.35rem' }}>
              🛡️ Fitur Peningkatan di Luar Contoh Modul:
            </strong>
            <ul style={{ paddingLeft: '1.1rem', lineHeight: '1.6' }}>
              <li><strong>Timeout {TIMEOUT_MS}ms:</strong> Menghindari browser hang saat server macet.</li>
              <li><strong>Autentikasi JWT:</strong> Login otomatis ke Server B via <code>POST /api/login</code>.</li>
              <li><strong>Smart 401 Handler:</strong> Re-login 1x jika token expired, bukan fallback palsu.</li>
              <li><strong>Validasi status: false:</strong> Tangani respons HTTP 200 namun status bisnis false.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
