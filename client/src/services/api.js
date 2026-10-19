// ============================================================
// Service API & Fallback Mechanism Helper
// ============================================================

import axios from 'axios';

export const SERVER_A_URL = import.meta.env.VITE_SERVER_A_URL || 'http://localhost:3001';
export const SERVER_B_URL = import.meta.env.VITE_SERVER_B_URL || 'http://localhost:3002';
export const AUTH_USERNAME = import.meta.env.VITE_AUTH_USERNAME || 'admin';
export const AUTH_PASSWORD = import.meta.env.VITE_AUTH_PASSWORD || 'password123';
export const TIMEOUT_MS = Number(import.meta.env.VITE_TIMEOUT_MS) || 3000;

// Instance Axios dengan batas timeout (mencegah hang permanen)
const apiClient = axios.create({
  timeout: TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json'
  }
});

let cachedToken = null;

/**
 * Autentikasi ke Server B untuk memperoleh Token JWT
 * @param {boolean} forceRefresh - Paksa perbarui token meski sudah tersimpan
 */
export async function loginServerB(forceRefresh = false) {
  if (cachedToken && !forceRefresh) {
    return cachedToken;
  }

  try {
    const res = await apiClient.post(`${SERVER_B_URL}/api/login`, {
      username: AUTH_USERNAME,
      password: AUTH_PASSWORD
    });

    if (res.data && res.data.token) {
      cachedToken = res.data.token;
      return cachedToken;
    }
    throw new Error('Gagal mendapatkan token JWT dari Server B');
  } catch (err) {
    console.error('[AUTH ERROR] Gagal login ke Server B:', err.message);
    throw err;
  }
}

/**
 * Helper request ke Server B dengan penanganan 401 (re-login 1x)
 */
async function fetchServerBWithAuth(endpoint, options = {}) {
  let token = await loginServerB();

  try {
    const res = await apiClient.get(`${SERVER_B_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });

    // Tangani kasus server membalas 200 tetapi status false
    if (res.data && res.data.status === false) {
      throw new Error(res.data.message || 'Server B merespons status=false');
    }

    return res;
  } catch (error) {
    // Jika 401 Unauthorized (token kadaluarsa/salah), coba login ulang SATU KALI
    if (error.response && error.response.status === 401) {
      console.warn('[AUTH 401] Token kedaluwarsa atau tidak sah. Mencoba login ulang...');
      token = await loginServerB(true); // perbarui token
      const retryRes = await apiClient.get(`${SERVER_B_URL}${endpoint}`, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`
        }
      });
      if (retryRes.data && retryRes.data.status === false) {
        throw new Error(retryRes.data.message || 'Server B merespons status=false');
      }
      return retryRes;
    }

    // Error lain (koneksi ditolak, timeout, 500) dilempar keluar
    throw error;
  }
}

/**
 * 1. KATEGORI SEBELUM FALLBACK (Versi Modul Awal)
 * Hanya memanggil Server A tanpa cadangan, catch hanya mencatat console.error
 */
export function getKategoriTanpaFallback() {
  return apiClient.get(`${SERVER_A_URL}/api/kategori`)
    .then(res => {
      if (res.data && res.data.status === false) {
        throw new Error('Server A merespons status=false');
      }
      return {
        data: res.data.data || [],
        sumber: res.data.sumber || res.headers['x-server'] || 'Server A',
        durasi: 0
      };
    })
    .catch(err => {
      console.error('Error mengambil data dari Server A (tanpa fallback):', err);
      throw err;
    });
}

/**
 * 2. KATEGORI DENGAN FALLBACK - Metode Nested Catch (Sesuai Konsep Modul)
 * Meminta ke Server A lebih dulu, jika gagal fallback meminta ke Server B.
 */
export function getKategoriNestedCatch() {
  const startTime = Date.now();
  const logSteps = [];

  logSteps.push(`[${new Date().toLocaleTimeString()}] Mencoba meminta data ke Server Utama (Server A: ${SERVER_A_URL})...`);

  return apiClient.get(`${SERVER_A_URL}/api/kategori`)
    .then(resA => {
      if (resA.data && resA.data.status === false) {
        throw new Error('Server A membalas 200 namun status=false');
      }
      const durasi = Date.now() - startTime;
      logSteps.push(`[${new Date().toLocaleTimeString()}] Berhasil menerima data dari Server A dalam ${durasi}ms.`);
      return {
        data: resA.data.data || [],
        sumber: resA.data.sumber || resA.headers['x-server'] || 'Server A',
        durasi,
        logs: logSteps,
        isFallback: false
      };
    })
    .catch(errA => {
      const errMsgA = errA.code === 'ECONNABORTED' 
        ? `Timeout (${TIMEOUT_MS}ms)` 
        : (errA.response ? `HTTP ${errA.response.status}` : errA.message);

      logSteps.push(`[${new Date().toLocaleTimeString()}] Server A GAGAL (${errMsgA}). Mengaktifkan Fallback ke Server Cadangan (Server B: ${SERVER_B_URL})...`);

      // Fallback ke Server B (dengan autentikasi JWT)
      return fetchServerBWithAuth('/api/kategori')
        .then(resB => {
          const durasi = Date.now() - startTime;
          logSteps.push(`[${new Date().toLocaleTimeString()}] Fallback BERHASIL! Menerima data dari Server B dalam total ${durasi}ms.`);
          return {
            data: resB.data.data || [],
            sumber: resB.data.sumber || resB.headers['x-server'] || 'Server B',
            durasi,
            logs: logSteps,
            isFallback: true,
            fallbackReason: `Server A gagal: ${errMsgA}`
          };
        })
        .catch(errB => {
          const errFinal = new Error('Kedua server gagal');
          errFinal.originalErrors = { serverA: errA, serverB: errB };
          errFinal.logs = logSteps;
          logSteps.push(`[${new Date().toLocaleTimeString()}] Server B juga GAGAL (${errB.message}). Seluruh server tidak merespons.`);
          console.error('Kedua server gagal:', errB);
          throw errFinal;
        });
    });
}

/**
 * 3. KATEGORI DENGAN FALLBACK - Metode Async/Await Loop (Enhanced Multi-Server)
 * Pola arsitektural yang lebih fleksibel dan scalable untuk n-server.
 */
export async function getKategoriAsyncLoop() {
  const startTime = Date.now();
  const logSteps = [];

  const serverConfigs = [
    {
      name: 'Server A (Utama)',
      url: `${SERVER_A_URL}/api/kategori`,
      isAuth: false
    },
    {
      name: 'Server B (Cadangan)',
      url: `${SERVER_B_URL}/api/kategori`,
      isAuth: true
    }
  ];

  let lastError = null;

  for (let i = 0; i < serverConfigs.length; i++) {
    const srv = serverConfigs[i];
    logSteps.push(`[${new Date().toLocaleTimeString()}] [Loop ${i + 1}/${serverConfigs.length}] Mencoba menghubungi ${srv.name}...`);

    try {
      let res;
      if (srv.isAuth) {
        res = await fetchServerBWithAuth('/api/kategori');
      } else {
        res = await apiClient.get(srv.url);
      }

      if (res.data && res.data.status === false) {
        throw new Error(`${srv.name} merespons status=false`);
      }

      const durasi = Date.now() - startTime;
      logSteps.push(`[${new Date().toLocaleTimeString()}] Sukses menerima data dari ${srv.name} (${durasi}ms).`);

      return {
        data: res.data.data || [],
        sumber: res.data.sumber || res.headers['x-server'] || (i === 0 ? 'Server A' : 'Server B'),
        durasi,
        logs: logSteps,
        isFallback: i > 0,
        fallbackReason: i > 0 ? `Server sebelumnya gagal: ${lastError ? lastError.message : 'Unknown'}` : null
      };
    } catch (err) {
      const errDetail = err.code === 'ECONNABORTED'
        ? `Timeout (${TIMEOUT_MS}ms)`
        : (err.response ? `HTTP ${err.response.status}` : err.message);

      lastError = err;
      logSteps.push(`[${new Date().toLocaleTimeString()}] Gagal terhubung ke ${srv.name}: ${errDetail}`);
      console.warn(`[LOOP] ${srv.name} gagal, mencoba kandidat server berikutnya...`);
    }
  }

  const errAll = new Error('Kedua server gagal');
  errAll.logs = logSteps;
  console.error('Kedua server gagal:', lastError);
  throw errAll;
}

/**
 * Mengambil data produk (dari Server B via JWT)
 */
export async function getProduk() {
  const res = await fetchServerBWithAuth('/api/produk');
  return {
    data: res.data.data || [],
    sumber: res.data.sumber || 'Server B'
  };
}

/**
 * Health check status kedua server secara simultan
 */
export async function checkServerHealth() {
  const results = {
    serverA: { online: false, status: 'Memeriksa...', detail: null },
    serverB: { online: false, status: 'Memeriksa...', detail: null }
  };

  try {
    const resA = await apiClient.get(`${SERVER_A_URL}/`, { timeout: 2000 });
    results.serverA = { online: true, status: 'Online', detail: resA.data };
  } catch (err) {
    results.serverA = { online: false, status: 'Offline', detail: err.message };
  }

  try {
    const resB = await apiClient.get(`${SERVER_B_URL}/`, { timeout: 2000 });
    results.serverB = { online: true, status: 'Online', detail: resB.data };
  } catch (err) {
    results.serverB = { online: false, status: 'Offline', detail: err.message };
  }

  return results;
}
