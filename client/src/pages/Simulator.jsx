import React, { useState } from 'react';
import axios from 'axios';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Key, 
  Terminal, 
  RefreshCw 
} from 'lucide-react';
import { 
  SERVER_A_URL, 
  SERVER_B_URL, 
  TIMEOUT_MS, 
  loginServerB 
} from '../services/api';

export default function Simulator() {
  const [running, setRunning] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [scenarioLogs, setScenarioLogs] = useState([]);
  const [scenarioResult, setScenarioResult] = useState(null);

  const addLog = (msg) => {
    setScenarioLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Skenario 1: Normal (Kedua server hidup, panggil Server A)
  const runScenario1 = async () => {
    setRunning(true);
    setActiveScenario(1);
    setScenarioLogs([]);
    setScenarioResult(null);

    addLog('Memulai Skenario 1: Menguji alur normal saat Server A hidup...');
    try {
      addLog(`Mengirim GET ke Server A (${SERVER_A_URL}/api/kategori)...`);
      const res = await axios.get(`${SERVER_A_URL}/api/kategori`, { timeout: TIMEOUT_MS });
      addLog(`Menerima respons HTTP ${res.status} dari Server A.`);
      addLog(`Header X-Server: ${res.headers['x-server'] || 'N/A'}`);
      addLog(`Total kategori: ${res.data.data.length}`);

      setScenarioResult({
        success: true,
        title: 'Skenario 1 BERHASIL',
        message: 'Data kategori berhasil dimuat dari Server Utama (Server A) tanpa memicu fallback.',
        sumber: res.data.sumber || 'Server A',
        data: res.data.data
      });
    } catch (err) {
      addLog(`Error: ${err.message}`);
      setScenarioResult({
        success: false,
        title: 'Skenario 1 GAGAL',
        message: 'Server A tidak dapat dihubungi. Pastikan Server A berjalan di port 3001.'
      });
    } finally {
      setRunning(false);
    }
  };

  // Skenario 2: Simulasi Server A Mati (Fallback ke Server B)
  const runScenario2 = async () => {
    setRunning(true);
    setActiveScenario(2);
    setScenarioLogs([]);
    setScenarioResult(null);

    addLog('Memulai Skenario 2: Simulasi Server A mati (menggunakan port palsu/mati 3999)...');
    const fakeServerA = 'http://localhost:3999';

    try {
      addLog(`Langkah 1: Mengirim permintaan ke Server Utama (${fakeServerA}/api/kategori)...`);
      await axios.get(`${fakeServerA}/api/kategori`, { timeout: TIMEOUT_MS });
    } catch (errA) {
      addLog(`Server A GAGAL dihubungi (${errA.message}).`);
      addLog('Memicu mekanisme fallback otomatis ke Server B...');

      try {
        addLog(`Langkah 2: Autentikasi JWT ke Server B (${SERVER_B_URL}/api/login)...`);
        const token = await loginServerB();
        addLog(`Token JWT diperoleh: ${token.substring(0, 25)}...`);

        addLog(`Langkah 3: Mengirim GET ke Server B (${SERVER_B_URL}/api/kategori) dengan Bearer Token...`);
        const resB = await axios.get(`${SERVER_B_URL}/api/kategori`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: TIMEOUT_MS
        });

        addLog(`Menerima respons HTTP ${resB.status} dari Server B.`);
        addLog(`Header X-Server: ${resB.headers['x-server']}`);
        addLog(`Total kategori didekripsi: ${resB.data.data.length}`);

        setScenarioResult({
          success: true,
          title: 'Skenario 2 (Fallback) BERHASIL',
          message: 'Server A mati, frontend otomatis mengalihkan request ke Server B. Data kategori berhasil didekripsi dan ditampilkan!',
          sumber: resB.data.sumber || 'Server B',
          data: resB.data.data
        });
      } catch (errB) {
        addLog(`Server B juga gagal: ${errB.message}`);
        setScenarioResult({
          success: false,
          title: 'Skenario 2 GAGAL',
          message: 'Fallback gagal karena Server B tidak dapat dihubungi.'
        });
      }
    } finally {
      setRunning(false);
    }
  };

  // Skenario 3: Simulasi Server A Hang / Timeout 3000ms
  const runScenario3 = async () => {
    setRunning(true);
    setActiveScenario(3);
    setScenarioLogs([]);
    setScenarioResult(null);

    addLog('Memulai Skenario 3: Simulasi Server A hang / tidak merespons...');
    addLog(`Batas toleransi timeout: ${TIMEOUT_MS}ms`);

    // Menggunakan URL yang tidak merespons (non-routable IP untuk simulasi timeout)
    const hangingUrl = 'http://10.255.255.1';

    try {
      addLog(`Mengirim permintaan ke server yang hang (${hangingUrl}). Menunggu timeout ${TIMEOUT_MS}ms...`);
      await axios.get(`${hangingUrl}/api/kategori`, { timeout: TIMEOUT_MS });
    } catch (errA) {
      addLog(`Timeout terpicu: ${errA.message} (Kode: ${errA.code || 'TIMEOUT'}).`);
      addLog('Fallback langsung diaktifkan tanpa membuat browser membeku!');

      try {
        addLog(`Mengalihkan ke Server B (${SERVER_B_URL}/api/kategori)...`);
        const token = await loginServerB();
        const resB = await axios.get(`${SERVER_B_URL}/api/kategori`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: TIMEOUT_MS
        });

        setScenarioResult({
          success: true,
          title: 'Skenario 3 (Timeout Fallback) BERHASIL',
          message: `Setelah timeout ${TIMEOUT_MS}ms terlampaui, request otomatis dipindahkan ke Server B dan sukses.`,
          sumber: resB.data.sumber || 'Server B',
          data: resB.data.data
        });
      } catch (errB) {
        addLog(`Server B gagal: ${errB.message}`);
      }
    } finally {
      setRunning(false);
    }
  };

  // Skenario 4: Simulasi Kedua Server Mati
  const runScenario4 = async () => {
    setRunning(true);
    setActiveScenario(4);
    setScenarioLogs([]);
    setScenarioResult(null);

    addLog('Memulai Skenario 4: Simulasi kedua server mati / offline...');
    const fakeA = 'http://localhost:3991';
    const fakeB = 'http://localhost:3992';

    try {
      addLog(`Mencoba menghubungi Server A (${fakeA})...`);
      await axios.get(`${fakeA}/api/kategori`, { timeout: 1500 });
    } catch (errA) {
      addLog(`Server A gagal: ${errA.message}`);
      addLog(`Mencoba fallback ke Server B (${fakeB})...`);

      try {
        await axios.get(`${fakeB}/api/kategori`, { timeout: 1500 });
      } catch (errB) {
        addLog(`Server B juga gagal: ${errB.message}`);
        console.error('Kedua server gagal:', errB);
        addLog('Eksekusi console.error("Kedua server gagal:", err) selesai.');

        setScenarioResult({
          success: false,
          isExpectedFailure: true,
          title: 'Skenario 4 (Kedua Server Mati) DITANGANI DENGAN BAIK',
          message: 'Pesan error ditampilkan di UI secara elegan dan error dicatat ke konsol sesuai instruksi modul.'
        });
      }
    } finally {
      setRunning(false);
    }
  };

  // Skenario 5: Simulasi Token JWT Invalid (401 Auto Re-Login)
  const runScenario5 = async () => {
    setRunning(true);
    setActiveScenario(5);
    setScenarioLogs([]);
    setScenarioResult(null);

    addLog('Memulai Skenario 5: Menguji penanganan HTTP 401 (bukan server mati)...');
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidtokenstring.abc';

    try {
      addLog('Langkah 1: Mengirim token JWT kedaluwarsa/salah ke Server B...');
      try {
        await axios.get(`${SERVER_B_URL}/api/kategori`, {
          headers: { Authorization: `Bearer ${invalidToken}` },
          timeout: TIMEOUT_MS
        });
      } catch (err401) {
        if (err401.response && err401.response.status === 401) {
          addLog('Menerima HTTP 401 Unauthorized (Bagus! Sistem tidak menganggap ini sebagai server mati).');
          addLog('Langkah 2: Melakukan re-login otomatis 1x untuk mendapatkan token baru...');
          const newToken = await loginServerB(true);
          addLog(`Token baru diperoleh: ${newToken.substring(0, 25)}...`);

          addLog('Langkah 3: Mengirim ulang request kategori dengan token baru...');
          const retryRes = await axios.get(`${SERVER_B_URL}/api/kategori`, {
            headers: { Authorization: `Bearer ${newToken}` },
            timeout: TIMEOUT_MS
          });

          setScenarioResult({
            success: true,
            title: 'Skenario 5 (401 Auto Re-Auth) BERHASIL',
            message: 'Error 401 berhasil ditangani dengan re-autentikasi otomatis satu kali tanpa salah menganggap server mati.',
            sumber: retryRes.data.sumber || 'Server B',
            data: retryRes.data.data
          });
        } else {
          throw err401;
        }
      }
    } catch (err) {
      addLog(`Error tidak terduga: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <ShieldAlert size={28} style={{ color: 'var(--primary)' }} />
          Simulator & Pengujian Kasus Khusus
        </h1>
        <p className="page-description">
          Jalankan simulasi otomatis seluruh skenario pengujian yang diminta pada tugas, termasuk toleransi timeout, penanganan token 401, dan simulasi kegagalan server.
        </p>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
        <button 
          onClick={runScenario1} 
          disabled={running} 
          className="btn btn-secondary" 
          style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1rem', textAlign: 'left', height: 'auto' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#34d399', marginBottom: '0.35rem' }}>
            <Play size={16} />
            Skenario 1: Normal
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Server A & B hidup. Data diambil dari Server A (Port 3001).
          </span>
        </button>

        <button 
          onClick={runScenario2} 
          disabled={running} 
          className="btn btn-secondary" 
          style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1rem', textAlign: 'left', height: 'auto' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#8b5cf6', marginBottom: '0.35rem' }}>
            <Play size={16} />
            Skenario 2: Server A Mati
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Server A mati. Otomatis fallback ke Server B via JWT.
          </span>
        </button>

        <button 
          onClick={runScenario3} 
          disabled={running} 
          className="btn btn-secondary" 
          style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1rem', textAlign: 'left', height: 'auto' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.35rem' }}>
            <Clock size={16} />
            Skenario 3: Timeout 3s
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Server A hang. Fallback terpicu setelah 3000ms.
          </span>
        </button>

        <button 
          onClick={runScenario4} 
          disabled={running} 
          className="btn btn-secondary" 
          style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1rem', textAlign: 'left', height: 'auto' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.35rem' }}>
            <XCircle size={16} />
            Skenario 4: Kedua Server Mati
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Server A & B mati. UI menampilkan pesan error & log konsol.
          </span>
        </button>

        <button 
          onClick={runScenario5} 
          disabled={running} 
          className="btn btn-secondary" 
          style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1rem', textAlign: 'left', height: 'auto' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.35rem' }}>
            <Key size={16} />
            Skenario 5: Token 401 Re-Auth
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Token salah/expired. Re-login otomatis 1x ke Server B.
          </span>
        </button>
      </div>

      {/* Result Banner if Available */}
      {scenarioResult && (
        <div className={`status-banner ${scenarioResult.success || scenarioResult.isExpectedFailure ? 'banner-server-a' : 'banner-danger'}`}>
          <div className="status-banner-left">
            {scenarioResult.success || scenarioResult.isExpectedFailure ? (
              <CheckCircle size={22} style={{ color: 'var(--server-a)' }} />
            ) : (
              <XCircle size={22} style={{ color: 'var(--danger)' }} />
            )}
            <div>
              <strong style={{ fontSize: '1rem' }}>{scenarioResult.title}</strong>
              <div style={{ fontSize: '0.84rem', marginTop: '0.2rem' }}>{scenarioResult.message}</div>
              {scenarioResult.sumber && (
                <div style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: '#6ee7b7' }}>
                  Sumber data: <strong>{scenarioResult.sumber}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Log Terminal for Simulator */}
      <div className="card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={18} style={{ color: 'var(--primary)' }} />
            <span>Terminal Trace Simulasi {activeScenario ? `(Skenario ${activeScenario})` : ''}</span>
          </div>
          {running && (
            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <RefreshCw size={13} className="animate-spin" /> Sedang menjalankan...
            </span>
          )}
        </div>

        <div className="log-box" style={{ minHeight: '200px' }}>
          {scenarioLogs.length > 0 ? (
            scenarioLogs.map((log, index) => (
              <div key={index} className="log-entry">
                {log}
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>
              Pilih salah satu skenario di atas untuk memulai pengujian simulasi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
