// ============================================================
// Server A - Crypto Utility (AES-256-GCM)
// Enkripsi simetris menggunakan modul bawaan 'crypto' Node.js
// Format ciphertext: base64(iv):base64(authTag):base64(data)
// ============================================================

const crypto = require('crypto');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });


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
 * Enkripsi teks/nilai dengan AES-256-GCM
 * @param {string|number} plaintext Nilai yang akan dienkripsi
 * @returns {string} Format: base64(iv):base64(authTag):base64(ciphertext)
 */
function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined) {
    return null;
  }

  const key = getKeyBuffer();
  // Standar rekomendasi NIST untuk IV AES-GCM adalah 12 byte (96 bit)
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  // Ubah plaintext ke string UTF-8
  const textValue = String(plaintext);
  let encrypted = cipher.update(textValue, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Auth tag 16 byte untuk integritas data (AEAD)
  const authTag = cipher.getAuthTag();

  // Kembalikan format base64(iv):base64(authTag):base64(data)
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

module.exports = {
  encrypt,
  getKeyBuffer
};
