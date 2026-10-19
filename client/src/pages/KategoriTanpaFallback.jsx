import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, RefreshCw, Server, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SERVER_A_URL } from '../services/api';

/**
 * Komponen Kategori SEBELUM Fallback (Versi Awal Sesuai Modul)
 * Karakteristik:
 * 1. Hanya melakukan axios.get ke satu server (Server A).
 * 2. Blok .catch() HANYA menjalankan console.error.
 * 3. Jika Server A mati atau terjadi gangguan jaringan, aplikasi tidak memiliki rencana cadangan,
 *    sehingga pengguna melihat layar kosong/stuck.
 */
export default function KategoriTanpaFallback() {
  const [kategori, setKategori] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sumberData, setSumberData] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  const fetchData = () => {
    setLoading(true);
    setErrorStatus(null);
    setSumberData(null);

    // KODE PERSIS POLA AWAL MODUL:
    axios.get(`${SERVER_A_URL}/api/kategori`)
      .then(res => {
        if (res.data && res.data.data) {
          setKategori(res.data.data);
          setSumberData(res.data.sumber || 'Server A');
        }
      })
      .catch(err => {
        // Pola awal modul: catch HANYA mencetak ke konsol tanpa penanganan cadangan
        console.error('Terjadi error saat mengambil data kategori:', err);
        setErrorStatus('Gagal mengambil data dari Server A (tanpa fallback)');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">
              Kategori (Sebelum Fallback)
              <span className="badge badge-warning">Non-Fallback</span>
            </h1>
            <p className="page-description">
              Implementasi awal sebelum mekanisme fallback diterapkan: hanya meminta ke Server A (Port 3001) dan catch hanya mencatat <code>console.error</code>.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={fetchData} className="btn btn-secondary" disabled={loading}>
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Muat Ulang
            </button>
            <Link to="/kategori" className="btn btn-primary">
              Buka Versi Fallback
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {sumberData && (
        <div className="status-banner banner-server-a">
          <div className="status-banner-left">
            <span className="status-indicator-dot dot-green dot-pulsing"></span>
            <div>
              <strong style={{ fontSize: '0.92rem' }}>Sumber data: {sumberData}</strong>
              <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>
                Data berhasil dimuat langsung dari server utama tanpa kendala.
              </div>
            </div>
          </div>
          <span className="badge badge-server-a">Server Utama OK</span>
        </div>
      )}

      {errorStatus && (
        <div className="status-banner banner-danger">
          <div className="status-banner-left">
            <span className="status-indicator-dot dot-red"></span>
            <div>
              <strong style={{ fontSize: '0.92rem' }}>{errorStatus}</strong>
              <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>
                Server A tidak dapat dihubungi. Karena tidak ada fallback, data kategori gagal dimuat sama sekali!
              </div>
            </div>
          </div>
          <span className="badge badge-danger">Single Point of Failure</span>
        </div>
      )}

      {/* Card Tabel Data Kategori */}
      <div className="card">
        <div className="card-title">
          <span>Data Kategori</span>
          {sumberData && <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sumber data: <strong>{sumberData}</strong></span>}
        </div>

        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
            <p>Menghubungi Server A (Port 3001)...</p>
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
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertCircle size={32} style={{ color: 'var(--danger)', margin: '0 auto 0.5rem' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>Tidak ada data kategori yang dapat ditampilkan</p>
            <p style={{ fontSize: '0.84rem' }}>
              Jika Server A mati, halaman ini tidak bisa mengambil data alternatif dari Server B.
            </p>
          </div>
        )}
      </div>

      {/* Kotak Analisis untuk Laporan */}
      <div className="card" style={{ background: '#0e1524', borderColor: '#1e293b' }}>
        <h4 style={{ fontSize: '0.92rem', color: '#93c5fd', marginBottom: '0.5rem' }}>
          💡 Bahan Analisis Laporan (Kelemahan Kode Sebelum Fallback):
        </h4>
        <ul style={{ fontSize: '0.82rem', color: 'var(--text-muted)', paddingLeft: '1.2rem', lineHeight: '1.7' }}>
          <li>
            <strong>Single Point of Failure:</strong> Aplikasi bergantung 100% pada satu server. Kegagalan Server A langsung mematikan fungsi bisnis.
          </li>
          <li>
            <strong>Penanganan Error Pasif:</strong> Blok <code>catch</code> hanya mengeksekusi <code>console.error</code> tanpa memberikan aksi pemulihan atau informasi alternatif.
          </li>
          <li>
            <strong>Tidak Ada Timeout Terkonfigurasi:</strong> Jika Server A mengalami hang (bukan crash), browser akan menunggu puluhan detik sebelum timeout bawaan terjadi.
          </li>
        </ul>
      </div>
    </div>
  );
}
