// ============================================================
// Server A - Controller Kategori
// Mengambil data kategori langsung dari db_a (plaintext)
// Digunakan sebagai server utama pada mekanisme fallback
// ============================================================

const pool = require('../config/db');

/**
 * Endpoint GET /api/kategori
 * Mengambil data kategori langsung dari db_a tanpa enkripsi
 * Format response diselaraskan dengan Server B agar konsisten di sisi Frontend
 */
async function getKategori(req, res) {
  try {
    console.log('\n============================================================');
    console.log('--- [SERVER A] MENGAMBIL DATA KATEGORI (SERVER UTAMA) ---');
    console.log('============================================================');

    const [rows] = await pool.query('SELECT id, nama_kategori FROM kategori ORDER BY id ASC');

    console.log(`[SERVER A] Berhasil mengambil ${rows.length} data kategori dari db_a (plaintext):`);
    console.table(rows);

    // Tandai header respon bahwa sumber data berasal dari Server A
    res.setHeader('X-Server', 'Server A');

    return res.status(200).json({
      status: true,
      success: true,
      message: 'Berhasil mengambil data kategori dari db_a (plaintext)',
      total: rows.length,
      data: rows,
      sumber: 'Server A'
    });
  } catch (error) {
    console.error('[SERVER A] Gagal mengambil kategori dari db_a:', error.message);
    return res.status(500).json({
      status: false,
      success: false,
      message: 'Gagal mengambil data kategori dari db_a',
      error: error.message
    });
  }
}

module.exports = {
  getKategori
};
