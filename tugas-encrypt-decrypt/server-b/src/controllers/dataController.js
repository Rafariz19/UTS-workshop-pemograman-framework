// ============================================================
// Server B - Controller Data (Terima, Simpan, dan Baca Data)
// Menangani penyimpanan data ciphertext (Langkah 2)
// dan penyajian data hasil dekripsi (Langkah 3 & 4)
// ============================================================

const pool = require('../config/db');
const { decrypt } = require('../utils/crypto');

/**
 * Langkah 2: Terima data terenkripsi dan simpan ke db_b
 * Menggunakan INSERT ... ON DUPLICATE KEY UPDATE agar idempotensial (tidak duplikat)
 */
async function terimaData(req, res) {
  const connection = await pool.getConnection();
  try {
    const { kategori, produk } = req.body;

    console.log('\n============================================================');
    console.log('--- [SERVER B] MENERIMA DATA DARI SERVER A (LANGKAH 2) ---');
    console.log('============================================================');

    if (!Array.isArray(kategori) || !Array.isArray(produk)) {
      return res.status(400).json({
        success: false,
        message: 'Format payload tidak valid. Field kategori dan produk harus berupa array.'
      });
    }

    console.log(`\n[STEP 2] Menerima data terenkripsi: ${kategori.length} kategori, ${produk.length} produk`);
    console.log('Contoh data kategori terenkripsi yang diterima:');
    console.log(kategori[0]);
    console.log('Contoh data produk terenkripsi yang diterima:');
    console.log(produk[0]);

    // Memulai transaksi MySQL
    await connection.beginTransaction();

    // 1. Simpan Kategori terlebih dahulu (karena produk memiliki foreign key ke kategori)
    let kategoriSaved = 0;
    for (const kat of kategori) {
      const sqlKategori = `
        INSERT INTO kategori (id, nama_kategori)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
          nama_kategori = VALUES(nama_kategori)
      `;
      await connection.query(sqlKategori, [kat.id, kat.nama_kategori]);
      kategoriSaved++;
    }

    // 2. Simpan Produk
    let produkSaved = 0;
    for (const prod of produk) {
      const sqlProduk = `
        INSERT INTO produk (id, nama_produk, harga_produk, foto_produk, id_kategori)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nama_produk = VALUES(nama_produk),
          harga_produk = VALUES(harga_produk),
          foto_produk = VALUES(foto_produk),
          id_kategori = VALUES(id_kategori)
      `;
      await connection.query(sqlProduk, [
        prod.id,
        prod.nama_produk,
        prod.harga_produk,
        prod.foto_produk,
        prod.id_kategori
      ]);
      produkSaved++;
    }

    await connection.commit();

    console.log(`\n[STEP 2] Sukses menyimpan ke DB B apa adanya (tetap terenkripsi):`);
    console.log(`- Kategori tersimpan: ${kategoriSaved}`);
    console.log(`- Produk tersimpan: ${produkSaved}`);
    console.log('============================================================\n');

    return res.status(200).json({
      success: true,
      message: 'Data terenkripsi berhasil disimpan ke db_b menggunakan ON DUPLICATE KEY UPDATE',
      totalKategori: kategoriSaved,
      totalProduk: produkSaved
    });
  } catch (error) {
    await connection.rollback();
    console.error('[STEP 2] ERROR saat menyimpan ke DB B:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan data terenkripsi ke db_b',
      error: error.message
    });
  } finally {
    connection.release();
  }
}

/**
 * Langkah 3 & 4: Ambil Kategori dari db_b (GET) dan Dekripsi
 */
async function getKategori(req, res) {
  try {
    console.log('\n============================================================');
    console.log('--- [SERVER B] MENGAMBIL DATA KATEGORI (LANGKAH 3 & 4) ---');
    console.log('============================================================');

    // Langkah 3: Ambil data dari db_b
    const [rows] = await pool.query('SELECT id, nama_kategori FROM kategori ORDER BY id ASC');

    console.log('\n[STEP 3] Data dari DB B (terenkripsi):');
    console.table(rows);

    // Langkah 4: Dekripsi data
    const decryptedRows = rows.map(row => {
      return {
        id: row.id,
        nama_kategori: decrypt(row.nama_kategori)
      };
    });

    console.log('\n[STEP 4] Setelah decrypt:');
    console.table(decryptedRows);
    console.log('============================================================\n');

    // Tandai header respon bahwa sumber data berasal dari Server B
    res.setHeader('X-Server', 'Server B');

    return res.status(200).json({
      status: true,
      success: true,
      message: 'Berhasil mengambil dan mendekripsi data kategori dari db_b',
      total: decryptedRows.length,
      data: decryptedRows,
      sumber: 'Server B'
    });
  } catch (error) {
    console.error('[STEP 3/4] ERROR mengambil/mendekripsi kategori:', error.message);
    return res.status(500).json({
      status: false,
      success: false,
      message: 'Gagal mengambil atau mendekripsi data kategori',
      error: error.message
    });
  }
}

/**
 * Langkah 3 & 4: Ambil Produk dari db_b (GET) menyertakan relasi kategori dan Dekripsi
 */
async function getProduk(req, res) {
  try {
    console.log('\n============================================================');
    console.log('--- [SERVER B] MENGAMBIL DATA PRODUK (LANGKAH 3 & 4) ---');
    console.log('============================================================');

    // Langkah 3: Ambil produk dengan relasi ke tabel kategori
    const sql = `
      SELECT 
        p.id,
        p.nama_produk,
        p.harga_produk,
        p.foto_produk,
        p.id_kategori,
        k.nama_kategori
      FROM produk p
      LEFT JOIN kategori k ON p.id_kategori = k.id
      ORDER BY p.id ASC
    `;
    const [rows] = await pool.query(sql);

    console.log('\n[STEP 3] Data dari DB B (terenkripsi):');
    console.table(rows);

    // Langkah 4: Dekripsi seluruh field teks ciphertext
    const decryptedRows = rows.map(row => {
      const plainHarga = decrypt(row.harga_produk);
      return {
        id: row.id,
        nama_produk: decrypt(row.nama_produk),
        // Konversi harga ke angka (float/decimal) jika valid
        harga_produk: !isNaN(plainHarga) ? parseFloat(plainHarga) : plainHarga,
        foto_produk: decrypt(row.foto_produk),
        id_kategori: row.id_kategori,
        nama_kategori: row.nama_kategori ? decrypt(row.nama_kategori) : null
      };
    });

    console.log('\n[STEP 4] Setelah decrypt:');
    console.table(decryptedRows);
    console.log('============================================================\n');

    // Tandai header respon bahwa sumber data berasal dari Server B
    res.setHeader('X-Server', 'Server B');

    return res.status(200).json({
      status: true,
      success: true,
      message: 'Berhasil mengambil dan mendekripsi data produk dari db_b (dengan relasi nama_kategori)',
      total: decryptedRows.length,
      data: decryptedRows,
      sumber: 'Server B'
    });
  } catch (error) {
    console.error('[STEP 3/4] ERROR mengambil/mendekripsi produk:', error.message);
    return res.status(500).json({
      status: false,
      success: false,
      message: 'Gagal mengambil atau mendekripsi data produk',
      error: error.message
    });
  }
}

module.exports = {
  terimaData,
  getKategori,
  getProduk
};

