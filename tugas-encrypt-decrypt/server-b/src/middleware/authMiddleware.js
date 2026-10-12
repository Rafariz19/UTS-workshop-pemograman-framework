// ============================================================
// Server B - Middleware JWT Authentication
// Memverifikasi token JWT dari header Authorization: Bearer <token>
// Mengembalikan status HTTP 401 jika token tidak ada atau tidak valid
// ============================================================

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak: Header Authorization tidak ditemukan (Status 401)'
    });
  }

  // Format standar: Bearer <token>
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak: Format token harus "Bearer <token>" (Status 401)'
    });
  }

  const token = parts[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak: Token tidak valid atau telah kedaluwarsa (Status 401)',
        error: err.message
      });
    }

    // Simpan payload user yang didecode ke req.user
    req.user = decoded;
    next();
  });
}

module.exports = {
  verifyToken
};
