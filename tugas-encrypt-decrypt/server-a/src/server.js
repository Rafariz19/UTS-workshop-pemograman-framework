// ============================================================
// Server A - Entry Point
// Berjalan di Port 3001, terhubung ke db_a
// ============================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const apiRoutes = require('./routes/api');
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware CORS untuk komunikasi dengan frontend React
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
  exposedHeaders: ['X-Server']
}));

// Middleware parsing JSON
app.use(express.json());

// Root endpoint untuk health check
app.get('/', (req, res) => {
  res.setHeader('X-Server', 'Server A');
  res.json({
    server: 'Server A',
    port: PORT,
    database: process.env.DB_NAME || 'db_a',
    status: 'Running',
    endpoints: [
      { method: 'POST', path: '/api/kirim-data', description: 'Enkripsi data dari db_a dan kirim ke Server B' },
      { method: 'GET', path: '/api/kategori', description: 'Ambil data kategori dari db_a (Plaintext, Server Utama Fallback)' }
    ]
  });
});

// Daftarkan route API
app.use('/api', apiRoutes);

// Jalankan server setelah mengecek koneksi database
async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log(`[SERVER A] Berhasil terhubung ke database MySQL: ${process.env.DB_NAME || 'db_a'}`);
    connection.release();

    app.listen(PORT, () => {
      console.log(`[SERVER A] Berjalan pada http://localhost:${PORT}`);
      console.log(`[SERVER A] Endpoint siap: POST http://localhost:${PORT}/api/kirim-data\n`);
    });
  } catch (error) {
    console.error('[SERVER A] Gagal menghubungkan ke database MySQL:', error.message);
    process.exit(1);
  }
}

startServer();
