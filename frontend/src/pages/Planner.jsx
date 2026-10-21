import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bgImage from '../assets/bg-mogo.jpg';

function Planner() {
  const navigate = useNavigate();
  const [tanaman, setTanaman] = useState('');
  const [hasilAi, setHasilAi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const savedUser = localStorage.getItem('mogo_user');
  const userStorage = savedUser ? JSON.parse(savedUser) : {};
  const namaUser = userStorage.name || 'Fadhil Wibowo';
  const inisial = namaUser.charAt(0).toUpperCase();

  const cariTanaman = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanaman })
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        setHasilAi(data);
      } else {
        alert(`❌ ${data.message || 'Tanaman tidak ditemukan di database MOGO.'}`);
        setHasilAi(null);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Gagal terhubung ke AI MOGO. Pastikan server nyala.");
    }
    setLoading(false);
  };

  const handleAddPlantToDashboard = async (namaTanaman, masaPanen) => {
    setIsAdding(true);
    const daysMatch = masaPanen ? String(masaPanen).match(/\d+/) : null;
    const targetDays = daysMatch ? parseInt(daysMatch[0]) : 30;
    const currentUserId = userStorage.id || 1; 

    try {
      const res = await fetch('http://localhost:3000/api/plants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUserId,
          name: namaTanaman,
          variety: 'Rekomendasi AI',
          location_type: 'Pot / Hidroponik',
          target_days: targetDays
        })
      });
      const result = await res.json();
      if (result.status === 'success') {
        alert(`🌱 Mantap! ${namaTanaman} berhasil ditanam di Dashboard kamu!`);
      }
    } catch (err) {
      alert("Gagal menambahkan tanaman.");
    }
    setIsAdding(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('mogo_user');
    navigate('/login');
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed font-sans selection:bg-green-200 relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Overlay Gradasi Putih Transparan */}
      <div className="fixed inset-0 bg-linear-to-br from-white/90 via-white/80 to-white/90 backdrop-blur-sm z-0 pointer-events-none"></div>

      <div className="relative z-10">
        {/* NAVBAR */}
        <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all duration-300">
          <nav className="px-6 py-4 text-gray-800 flex justify-between items-center max-w-7xl mx-auto">
            <div className="text-2xl font-extrabold tracking-widest cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate('/dashboard')}>
              MOGO<span className="text-green-600">.</span>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="hidden md:flex gap-8 text-sm font-bold tracking-widest uppercase">
                <Link to="/dashboard" className="text-gray-500 hover:text-green-500 transition-colors pb-1">DASHBOARD</Link>
                <button className="text-green-600 border-b-2 border-green-600 pb-1 cursor-default">PLANNER AI</button>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-11 h-11 rounded-full bg-green-50 border-2 border-green-500 text-green-700 flex items-center justify-center font-extrabold shadow-sm hover:scale-105 transition-transform focus:outline-none ring-4 ring-green-50"
                >
                  {userStorage?.photo_url ? (
                    <img src={userStorage.photo_url} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    inisial
                  )}
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-4 w-56 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50 animate-fade-in-up">
                    <Link to="/profile" className="flex items-center gap-3 px-5 py-4 text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                      <span className="text-lg">👤</span> Profil Saya
                    </Link>
                    <div className="border-t border-gray-50"></div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 text-left px-5 py-4 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
                      <span className="text-lg">🚪</span> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>

        <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center">
          
          {/* FORM PENCARIAN */}
          <div className="w-full bg-white/90 backdrop-blur-md p-8 md:p-12 rounded-4xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 text-center">
            <div className="inline-block p-4 bg-green-50 rounded-2xl text-4xl mb-4">🤖</div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Tanya AI MOGO<span className="text-green-600">.</span></h1>
            <p className="text-gray-500 mb-8 font-medium text-base md:text-lg">Ketik nama sayur atau buah, AI kami akan mencarikan panduan tanam terbaik.</p>
            
            <form onSubmit={cariTanaman} className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                value={tanaman} 
                onChange={(e) => setTanaman(e.target.value)} 
                placeholder="Contoh: Selada, Pakcoy, Tomat..." 
                className="flex-1 px-6 py-4 rounded-2xl bg-gray-50/80 border border-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 text-gray-800 font-bold placeholder-gray-400 transition-all"
                required
              />
              <button 
                type="submit" 
                disabled={loading}
                className="px-10 py-4 bg-green-600 hover:bg-green-500 text-white font-extrabold rounded-2xl shadow-md transition-all disabled:opacity-75 flex justify-center items-center active:scale-95"
              >
                {loading ? 'Mencari...' : 'Cari Panduan'}
              </button>
            </form>
          </div>

          {/* KARTU HASIL AI */}
          {hasilAi && !hasilAi.error && (
            <div className="w-full mt-10 bg-white/90 backdrop-blur-md p-8 md:p-12 rounded-4xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 animate-fade-in-up">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 border-b border-gray-100 pb-6 mb-8 flex items-center gap-3">
                🌾 Hasil Analisis: <span className="text-green-600">{hasilAi.tanaman}</span>
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                <div className="bg-gray-50/60 p-6 rounded-2xl border border-gray-100">
                  <p className="text-xs text-green-600 font-extrabold uppercase tracking-widest mb-2">Masa Panen</p>
                  <p className="text-gray-800 font-extrabold text-lg">{hasilAi.parameter_ideal?.masa_panen || '30 Hari'}</p>
                </div>
                <div className="bg-gray-50/60 p-6 rounded-2xl border border-gray-100">
                  <p className="text-xs text-green-600 font-extrabold uppercase tracking-widest mb-2">Penyiraman</p>
                  <p className="text-gray-800 font-extrabold text-lg">{hasilAi.parameter_ideal?.penyiraman}</p>
                </div>
                <div className="bg-gray-50/60 p-6 rounded-2xl border border-gray-100">
                  <p className="text-xs text-green-600 font-extrabold uppercase tracking-widest mb-2">Sinar Matahari</p>
                  <p className="text-gray-800 font-extrabold text-lg">{hasilAi.parameter_ideal?.sinar_matahari}</p>
                </div>
                <div className="bg-gray-50/60 p-6 rounded-2xl border border-gray-100">
                  <p className="text-xs text-green-600 font-extrabold uppercase tracking-widest mb-2">Pupuk / pH</p>
                  <p className="text-gray-800 font-extrabold text-lg">{hasilAi.parameter_ideal?.pupuk} <br/><span className="text-xs font-normal text-gray-500">(pH: {hasilAi.parameter_ideal?.ph_tanah})</span></p>
                </div>
              </div>

              <button
                onClick={() => handleAddPlantToDashboard(hasilAi.tanaman, hasilAi.parameter_ideal?.masa_panen)}
                disabled={isAdding}
                className="w-full py-5 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-extrabold text-lg rounded-2xl shadow-lg shadow-green-600/20 transition-transform active:scale-95 disabled:opacity-75 flex justify-center items-center gap-3"
              >
                {isAdding ? 'Menambahkan...' : 'Tambah ke Kebun Saya'}
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default Planner;