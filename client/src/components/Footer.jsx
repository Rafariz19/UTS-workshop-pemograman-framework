import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          Tugas 11 - Fallback Mechanism (Frontend React JS)
        </p>
        <p style={{ color: 'var(--text-subtle)', fontSize: '0.78rem' }}>
          Dibuat oleh: <strong style={{ color: 'var(--primary)' }}>Rafael Rizky Luga Tanjung</strong> • NRP: <strong style={{ color: 'var(--text-muted)' }}>3125522007</strong>
        </p>
        <p style={{ color: 'var(--text-subtle)', fontSize: '0.74rem', marginTop: '0.4rem' }}>
          Backend bersumber dari arsitektur tugas Enkripsi & Dekripsi AES-256-GCM + JWT (Server A: Port 3001 | Server B: Port 3002)
        </p>
      </div>
    </footer>
  );
}
