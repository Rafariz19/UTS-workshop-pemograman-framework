import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Kategori from './pages/Kategori';
import KategoriTanpaFallback from './pages/KategoriTanpaFallback';
import Produk from './pages/Produk';
import Simulator from './pages/Simulator';

export default function App() {
  return (
    <Router>
      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/kategori" element={<Kategori />} />
            <Route path="/kategori-tanpa-fallback" element={<KategoriTanpaFallback />} />
            <Route path="/produk" element={<Produk />} />
            <Route path="/simulator" element={<Simulator />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
