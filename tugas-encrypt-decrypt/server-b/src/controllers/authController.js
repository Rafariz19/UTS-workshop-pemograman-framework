// ============================================================
// Server B - Controller Autentikasi (Login & JWT)
// Menangani login pengguna statis dan menghasilkan JWT token
// ============================================================

const jwt = require('jsonwebtoken');
require('dotenv').config();

const AUTH_USERNAME = process.env.AUTH_USERNAME || 'admin';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'password123';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi'
      });
    }

    // Validasi dengan kredensial di .env
    if (username !== AUTH_USERNAME || password !== AUTH_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah (Status 401)'
      });
    }

    // Buat token JWT
    const payload = {
      username: AUTH_USERNAME,
      role: 'admin'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    console.log(`[AUTH] User "${username}" berhasil login dan mendapatkan JWT token`);

    return res.status(200).json({
      success: true,
      message: 'Login berhasil',
      token,
      expiresIn: JWT_EXPIRES_IN
    });
  } catch (error) {
    console.error('[AUTH] ERROR saat login:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memproses login',
      error: error.message
    });
  }
}

module.exports = {
  login
};
