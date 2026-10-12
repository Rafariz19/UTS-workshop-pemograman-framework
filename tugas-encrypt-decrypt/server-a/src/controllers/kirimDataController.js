// ============================================================
// Server A - Controller Kirim Data
// Mengambil data dari db_a, mengenkripsi field non-key,
// lalu mengirimkannya ke Server B lewat POST /api/terima-data
// ============================================================

const axios = require('axios');
const pool = require('../config/db');
const { encrypt } = require('../utils/crypto');
require('dotenv').config();

const SERVER_B_URL = process.env.SERVER_B_URL || 'http://localhost:3002';

async function kirimData(req, res) {
  try {
    console.log('\n============================================================');
    console.log('--- [SERVER A] MEMULAI PROSES PENGIRIMAN DATA (LANGKAH 1) ---');
    console.log('============================================================');

    // 1. Ambil data dari db_a
    const [kategoriRows] = await pool.query('SELECT id, nama_kategori FROM kategori ORDER BY id ASC');
    const [produkRows] = await pool.query('SELECT id, nama_produk, harga_produk, foto_produk, id_kategori FROM produk ORDER BY id ASC');

    console.log('\n[STEP 1] Data asli dari db_a:');
    console.log('Kategori (' + kategoriRows.length + ' baris):');
    console.table(kategoriRows);
    console.log('Produk (' + produkRows.length + ' baris):');
    console.table(produkRows);

    // 2. Enkripsi tiap field (kecuali id dan id_kategori)
    const encryptedKategori = kategoriRows.map(kat => ({
      id: kat.id, // ID TIDAK dienkripsi agar Primary Key tetap utuh
      nama_kategori: encrypt(kat.nama_kategori)
    }));

    const encryptedProduk = produkRows.map(prod => ({
      id: prod.id, // ID TIDAK dienkripsi agar Primary Key tetap utuh
      nama_produk: encrypt(prod.nama_produk),
      harga_produk: encrypt(prod.harga_produk),
      foto_produk: encrypt(prod.foto_produk),
      id_kategori: prod.id_kategori // id_kategori TIDAK dienkripsi agar Foreign Key tetap utuh
    }));

    console.log('\n[STEP 1] Setelah encrypt:');
    console.log('Kategori terenkripsi contoh (item pertama):');
    console.log(encryptedKategori[0]);
    console.log('Produk terenkripsi contoh (item pertama):');
    console.log(encryptedProduk[0]);

    // 3. Kirim ke Server B via POST
    const payload = {
      kategori: encryptedKategori,
      produk: encryptedProduk
    };

    const targetUrl = `${SERVER_B_URL}/api/terima-data`;
    console.log(`\n[STEP 1] Mengirim ${encryptedKategori.length} kategori dan ${encryptedProduk.length} produk ke Server B: ${targetUrl}...`);

    const responseServerB = await axios.post(targetUrl, payload);

    console.log('[STEP 1] Sukses menerima respon dari Server B:', responseServerB.data);
    console.log('============================================================\n');

    return res.status(200).json({
      success: true,
      message: 'Data dari db_a berhasil dienkripsi dan dikirim ke Server B',
      meta: {
        totalKategori: encryptedKategori.length,
        totalProduk: encryptedProduk.length,
        targetServer: targetUrl
      },
      dataTerkirim: payload,
      serverBResponse: responseServerB.data
    });
  } catch (error) {
    console.error('[STEP 1] ERROR pada Server A:', error.message);
    if (error.response) {
      console.error('[STEP 1] Respon error dari Server B:', error.response.data);
    }
    return res.status(500).json({
      success: false,
      message: 'Gagal mengenkripsi atau mengirim data ke Server B',
      error: error.response ? error.response.data : error.message
    });
  }
}

module.exports = {
  kirimData
};
