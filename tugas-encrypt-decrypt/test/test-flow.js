// ============================================================
// Automated End-to-End Test Script
// Menguji seluruh alur dari Langkah 1 sampai Langkah 4
// ============================================================

const axios = require('../server-a/node_modules/axios');
const mysql = require('../server-a/node_modules/mysql2/promise');

const SERVER_A_URL = 'http://localhost:3001';
const SERVER_B_URL = 'http://localhost:3002';

async function runTest() {
  console.log('\n============================================================');
  console.log('       AUTOMATED END-TO-END TEST ENCRYPT & DECRYPT          ');
  console.log('============================================================\n');

  let passedAll = true;

  try {
    // 0. Ambil data asli langsung dari db_a untuk perbandingan validasi
    const connA = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'db_a'
    });
    const [originalKategori] = await connA.query('SELECT * FROM kategori ORDER BY id ASC');
    const [originalProduk] = await connA.query('SELECT * FROM produk ORDER BY id ASC');
    await connA.end();

    console.log(`[TEST 0] Data referensi db_a berhasil dibaca: ${originalKategori.length} kategori, ${originalProduk.length} produk.\n`);

    // 1. Uji STEP 1 & 2: POST /api/kirim-data di Server A
    console.log('------------------------------------------------------------');
    console.log('[TEST 1] Menguji POST /api/kirim-data (Server A -> Server B)...');
    const resKirim = await axios.post(`${SERVER_A_URL}/api/kirim-data`);
    console.log('Status HTTP:', resKirim.status);
    console.log('Pesan:', resKirim.data.message);
    if (resKirim.status === 200 && resKirim.data.success) {
      console.log('>>> [PASS] Langkah 1 & 2 berhasil dieksekusi!\n');
    } else {
      console.error('>>> [FAIL] Langkah 1 & 2 gagal!');
      passedAll = false;
    }

    // 2. Verifikasi Data di DB B (Harus Berupa Ciphertext!)
    console.log('------------------------------------------------------------');
    console.log('[TEST 2] Verifikasi Data di DB B (harus berupa ciphertext teks)...');
    const connB = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'db_b'
    });
    const [dbbKategori] = await connB.query('SELECT * FROM kategori ORDER BY id ASC');
    const [dbbProduk] = await connB.query('SELECT * FROM produk ORDER BY id ASC');
    await connB.end();

    console.log('Contoh baris kategori di db_b:');
    console.log(dbbKategori[0]);
    console.log('Contoh baris produk di db_b:');
    console.log(dbbProduk[0]);

    // Format valid: iv:authTag:data (3 komponen base64)
    const isCiphertext = (val) => typeof val === 'string' && val.split(':').length === 3;
    const kategoriEncryptedOk = dbbKategori.every(k => isCiphertext(k.nama_kategori));
    const produkEncryptedOk = dbbProduk.every(p => 
      isCiphertext(p.nama_produk) && isCiphertext(p.harga_produk) && isCiphertext(p.foto_produk)
    );

    if (kategoriEncryptedOk && produkEncryptedOk) {
      console.log('>>> [PASS] Semua field di DB B terbukti tersimpan dalam format ciphertext AES-256-GCM!\n');
    } else {
      console.error('>>> [FAIL] Data di DB B tidak tersimpan sebagai ciphertext yang valid!');
      passedAll = false;
    }

    // 3. Uji Autentikasi JWT: Login
    console.log('------------------------------------------------------------');
    console.log('[TEST 3] Menguji POST /api/login di Server B...');
    const resLogin = await axios.post(`${SERVER_B_URL}/api/login`, {
      username: 'admin',
      password: 'password123'
    });
    const token = resLogin.data.token;
    console.log('Status HTTP:', resLogin.status);
    console.log('Token diperoleh:', token.substring(0, 30) + '...');
    if (token) {
      console.log('>>> [PASS] Login berhasil dan token JWT valid diperoleh!\n');
    } else {
      console.error('>>> [FAIL] Login gagal mendapatkan token!');
      passedAll = false;
    }

    // 4. Uji Akses Tanpa Token (Harus mengembalikan HTTP 401)
    console.log('------------------------------------------------------------');
    console.log('[TEST 4] Menguji GET /api/kategori dan /api/produk TANPA token (Ekspektasi: 401 Unauthorized)...');
    try {
      await axios.get(`${SERVER_B_URL}/api/kategori`);
      console.error('>>> [FAIL] Harusnya mengembalikan 401, tetapi berhasil!');
      passedAll = false;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('GET /api/kategori tanpa token -> HTTP', err.response.status, '(Benar)');
      } else {
        console.error('>>> [FAIL] Respon tidak sesuai:', err.message);
        passedAll = false;
      }
    }

    try {
      await axios.get(`${SERVER_B_URL}/api/produk`);
      console.error('>>> [FAIL] Harusnya mengembalikan 401, tetapi berhasil!');
      passedAll = false;
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('GET /api/produk tanpa token   -> HTTP', err.response.status, '(Benar)');
        console.log('>>> [PASS] Middleware JWT berhasil menolak akses tanpa token (HTTP 401)!\n');
      } else {
        console.error('>>> [FAIL] Respon tidak sesuai:', err.message);
        passedAll = false;
      }
    }

    // 5. Uji STEP 3 & 4: GET /api/kategori DENGAN Token JWT
    console.log('------------------------------------------------------------');
    console.log('[TEST 5] Menguji GET /api/kategori DENGAN Bearer Token...');
    const resGetKategori = await axios.get(`${SERVER_B_URL}/api/kategori`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Status HTTP:', resGetKategori.status);
    console.log('Jumlah Kategori Didekripsi:', resGetKategori.data.data.length);

    // Bandingkan dengan data asli db_a
    let matchKategori = true;
    resGetKategori.data.data.forEach((kat, i) => {
      const orig = originalKategori[i];
      if (kat.id !== orig.id || kat.nama_kategori !== orig.nama_kategori) {
        matchKategori = false;
      }
    });

    if (matchKategori) {
      console.log('>>> [PASS] Data kategori hasil dekripsi COCOK 100% dengan data asli di db_a!\n');
    } else {
      console.error('>>> [FAIL] Data kategori hasil dekripsi tidak cocok dengan db_a!');
      passedAll = false;
    }

    // 6. Uji STEP 3 & 4: GET /api/produk DENGAN Token JWT
    console.log('------------------------------------------------------------');
    console.log('[TEST 6] Menguji GET /api/produk DENGAN Bearer Token (beserta nama_kategori)...');
    const resGetProduk = await axios.get(`${SERVER_B_URL}/api/produk`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Status HTTP:', resGetProduk.status);
    console.log('Jumlah Produk Didekripsi:', resGetProduk.data.data.length);

    // Bandingkan dengan data asli db_a
    let matchProduk = true;
    resGetProduk.data.data.forEach((prod, i) => {
      const orig = originalProduk[i];
      const origKat = originalKategori.find(k => k.id === orig.id_kategori);
      if (
        prod.id !== orig.id ||
        prod.nama_produk !== orig.nama_produk ||
        Number(prod.harga_produk) !== Number(orig.harga_produk) ||
        prod.foto_produk !== orig.foto_produk ||
        prod.id_kategori !== orig.id_kategori ||
        prod.nama_kategori !== (origKat ? origKat.nama_kategori : null)
      ) {
        matchProduk = false;
        console.error('Mismatch pada produk id', prod.id, { hasil: prod, asli: orig });
      }
    });

    if (matchProduk) {
      console.log('>>> [PASS] Data produk hasil dekripsi beserta nama_kategori COCOK 100% dengan data asli di db_a!\n');
    } else {
      console.error('>>> [FAIL] Data produk hasil dekripsi tidak cocok dengan db_a!');
      passedAll = false;
    }

    console.log('============================================================');
    if (passedAll) {
      console.log('             SEMUA PENGUJIAN BERHASIL (100% PASS)           ');
      console.log('============================================================\n');
    } else {
      console.log('             BEBERAPA PENGUJIAN GAGAL                       ');
      console.log('============================================================\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('Terjadi error saat menjalankan pengujian:', error.message);
    if (error.response) {
      console.error('Detail response error:', error.response.data);
    }
    process.exit(1);
  }
}

runTest();
