// ============================================================
// Server B - Crypto Utility (AES-256-GCM)
// Dekripsi simetris menggunakan modul bawaan 'crypto' Node.js
// Format ciphertext: base64(iv):base64(authTag):base64(data)
// ============================================================

const crypto = require('crypto');
require('dotenv').config();

// Mengambil dan memvalidasi encryption key 32 byte (256-bit)
function getKeyBuffer() {
  const keyStr = process.env.ENCRYPTION_KEY;
  if (!keyStr) {
    throw new Error('ENCRYPTION_KEY belum didefinisikan di file .env');
  }

  // Jika kunci dalam format hex (64 karakter hex = 32 byte)
  if (keyStr.length === 64 && /^[0-9a-fA-F]+$/.test(keyStr)) {
    return Buffer.from(keyStr, 'hex');
  }

  // Jika kunci tepat 32 karakter utf-8
  if (Buffer.byteLength(keyStr, 'utf8') === 32) {
    return Buffer.from(keyStr, 'utf8');
  }

  // Jika kunci kurang atau lebih dari 32 byte, buat hash sha256 agar tepat 32 byte
  return crypto.createHash('sha256').update(keyStr).digest();
}

/**
 * Dekripsi ciphertext dengan format base64(iv):base64(authTag):base64(data)
 * @param {string} cipherTextString Ciphertext yang akan didekripsi
 * @returns {string} Plaintext hasil dekripsi
 */
function decrypt(cipherTextString) {
  if (!cipherTextString) {
    return null;
  }

  // Pisahkan 3 bagian dengan pemisah ':'
  const parts = String(cipherTextString).split(':');
  if (parts.length !== 3) {
    throw new Error('Format ciphertext tidak valid. Harus iv:authTag:data dalam format base64');
  }

  const [ivBase64, authTagBase64, encryptedBase64] = parts;
  const key = getKeyBuffer();
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const encryptedText = Buffer.from(encryptedBase64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, null, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = {
  decrypt,
  getKeyBuffer
};
