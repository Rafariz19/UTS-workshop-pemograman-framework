import React, { useState, useEffect } from 'react';
import { ShoppingBag, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import { getProduk, SERVER_B_URL } from '../services/api';

export default function Produk() {
  const [produk, setProduk] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProdukData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProduk();
      setProduk(res.data);
    } catch (err) {
      console.error('Gagal mengambil produk:', err);
      setError('Gagal mengambil data produk dari Server B (pastikan Server B aktif dan autentikasi JWT berhasil)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdukData();
  }, []);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number);
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">
              <ShoppingBag size={26} style={{ color: 'var(--primary)' }} />
              Katalog Produk
            </h1>
            <p className="page-description">
              Data produk diambil dari <strong>Server B (Port 3002)</strong> melalui autentikasi JWT. Di database <code>db_b</code> data tersimpan dalam bentuk ciphertext AES-256-GCM dan didekripsi saat dikirim ke frontend.
            </p>
          </div>
          <button onClick={fetchProdukData} className="btn btn-secondary" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Muat Ulang
          </button>
        </div>
      </div>

      {error ? (
        <div className="status-banner banner-danger">
          <div className="status-banner-left">
            <AlertCircle size={20} />
            <div>
              <strong>{error}</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="status-banner banner-server-b">
          <div className="status-banner-left">
            <ShieldCheck size={20} />
            <div>
              <strong>Terhubung ke Server B (Hasil Dekripsi AES-256-GCM)</strong>
              <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>
                Relasi <code>id_kategori</code> di-JOIN dengan tabel kategori sehingga menghasilkan nama kategori yang valid.
              </div>
            </div>
          </div>
          <span className="badge badge-server-b">JWT Authenticated</span>
        </div>
      )}

      <div className="card">
        <div className="card-title">
          <span>Daftar Produk ({produk.length} item)</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sumber data: <strong>Server B (Port 3002)</strong></span>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: 'var(--primary)' }} />
            <p>Memuat dan mendekripsi data produk dari Server B...</p>
          </div>
        ) : produk.length > 0 ? (
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th className="col-number">#</th>
                  <th>Nama Produk</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Foto Produk</th>
                </tr>
              </thead>
              <tbody>
                {produk.map((p, index) => (
                  <tr key={p.id || index}>
                    <td className="col-number">{index + 1}</td>
                    <td style={{ fontWeight: 600 }}>{p.nama_produk}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                        {p.nama_kategori || `ID ${p.id_kategori}`}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#34d399' }}>
                      {formatRupiah(p.harga_produk)}
                    </td>
                    <td style={{ color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.84rem' }}>
                      <code>{p.foto_produk}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>Tidak ada data produk yang tersedia.</p>
          </div>
        )}
      </div>
    </div>
  );
}
