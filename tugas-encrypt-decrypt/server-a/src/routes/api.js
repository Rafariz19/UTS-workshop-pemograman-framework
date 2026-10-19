// ============================================================
// Server A - Routes
// Endpoint: POST /api/kirim-data
// ============================================================

const express = require('express');
const router = express.Router();
const { kirimData } = require('../controllers/kirimDataController');

// Route untuk enkripsi data db_a dan kirim ke Server B
router.post('/kirim-data', kirimData);

// Route untuk mengambil kategori dari db_a (Mekanisme Fallback - Server Utama)
const { getKategori } = require('../controllers/kategoriController');
router.get('/kategori', getKategori);

module.exports = router;

