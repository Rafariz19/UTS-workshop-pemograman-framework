// ============================================================
// Server B - Entry Point
// Berjalan di Port 3002, terhubung ke db_b
// ============================================================

const express = require('express');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware parsing JSON
app.use(express.json());

// Root endpoint untuk health check
app.get('/', (req, res) => {
  res.json({
    server: 'Server B',
    port: PORT,
    database: process.env.DB_NAME || 'db_b',
    status: 'Running',
    endpoints: [
      { method: 'POST', path: '/api/login', description: 'Login dan generate token JWT' },
      { method: 'POST', path: '/api/terima-data', description: 'Terima dan simpan data terenkripsi ke db_b' },
      { method: 'GET',  path: '/api/kategori', description: 'Ambil dan dekripsi data kategori (JWT required)' },
      { method: 'GET',  path: '/api/produk', description: 'Ambil dan dekripsi data produk beserta kategori (JWT required)' }
    ]
  });
});

// Daftarkan route API
app.use('/api', apiRoutes);

// Jalankan server setelah mengecek koneksi database
async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log(`[SERVER B] Berhasil terhubung ke database MySQL: ${process.env.DB_NAME || 'db_b'}`);
    connection.release();

    app.listen(PORT, () => {
      console.log(`[SERVER B] Berjalan pada http://localhost:${PORT}`);
      console.log(`[SERVER B] Endpoints siap:`);
      console.log(`  - POST http://localhost:${PORT}/api/login`);
      console.log(`  - POST http://localhost:${PORT}/api/terima-data`);
      console.log(`  - GET  http://localhost:${PORT}/api/kategori  (Bearer Token)`);
      console.log(`  - GET  http://localhost:${PORT}/api/produk    (Bearer Token)\n`);
    });
  } catch (error) {
    console.error('[SERVER B] Gagal menghubungkan ke database MySQL:', error.message);
    process.exit(1);
  }
}

startServer();
