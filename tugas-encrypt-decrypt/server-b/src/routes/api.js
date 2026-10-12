// ============================================================
// Server B - Routes
// Endpoints:
// - POST /api/login        : Autentikasi statis & generate JWT token
// - POST /api/terima-data  : Menerima dan menyimpan ciphertext ke db_b
// - GET  /api/kategori     : Dilindungi JWT, menyajikan kategori hasil dekripsi
// - GET  /api/produk       : Dilindungi JWT, menyajikan produk hasil dekripsi
// ============================================================

const express = require('express');
const router = express.Router();

const { login } = require('../controllers/authController');
const { terimaData, getKategori, getProduk } = require('../controllers/dataController');
const { verifyToken } = require('../middleware/authMiddleware');

// Endpoint publik
router.post('/login', login);
router.post('/terima-data', terimaData);

// Endpoint terproteksi JWT
router.get('/kategori', verifyToken, getKategori);
router.get('/produk', verifyToken, getProduk);

module.exports = router;
