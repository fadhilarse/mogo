import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bgImage from '../assets/bg-mogo.jpg';

const getGelarPetani = (totalMisi) => {
  if (totalMisi >= 50) return { level: 5, gelar: "Master Agrikultur", color: "bg-yellow-500", icon: "👑" };
  if (totalMisi >= 25) return { level: 4, gelar: "Petani Ahli", color: "bg-purple-500", icon: "🎖️" };
  if (totalMisi >= 10) return { level: 3, gelar: "Petani Terampil", color: "bg-blue-500", icon: "🏅" };
  if (totalMisi >= 5)  return { level: 2, gelar: "Petani Berkembang", color: "bg-green-500", icon: "🌱" };
  return { level: 1, gelar: "Petani Pemula", color: "bg-gray-400", icon: "🐣" };
};

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ aktif: 0, panen: 0 });
  const [trophies, setTrophies] = useState([]);
  const [logs, setLogs] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [notifSiram, setNotifSiram] = useState(() => {
    const saved = localStorage.getItem('mogo_pref_siram');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [notifAI, setNotifAI] = useState(() => {
    const saved = localStorage.getItem('mogo_pref_ai');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('mogo_pref_siram', JSON.stringify(notifSiram));
  }, [notifSiram]);

  useEffect(() => {
    localStorage.setItem('mogo_pref_ai', JSON.stringify(notifAI));
  }, [notifAI]);

  useEffect(() => {
    const savedUser = localStorage.getItem('mogo_user');
    if (!savedUser) {
      navigate('/login');
      return;
    }
    
    const userStorage = JSON.parse(savedUser);
    setUser(userStorage);

    const fetchStats = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/dashboard/${userStorage.id}`);
        const result = await res.json();
        if (result.status === 'success') {
          setUser(result.data.user); 
          setStats({
            aktif: result.data.plants?.length || 0,
            panen: result.data.trophies?.length || 0,
          });
          setTrophies(result.data.trophies || []);
        }

        const resLog = await fetch(`http://localhost:3000/api/logs/${userStorage.id}`);
        const resultLog = await resLog.json();
        if (resultLog.status === 'success') setLogs(resultLog.data);

      } catch (err) {
        console.error("Gagal load stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('mogo_user');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    const isConfirmed = window.confirm("🚨 PERINGATAN!\n\nApakah kamu yakin ingin menghapus akun ini secara permanen? Semua data kebun, progres, dan panen akan hilang.");
    
    if (isConfirmed && user) {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:3000/api/users/${user.id}`, { method: 'DELETE' });
        const result = await res.json();

        if (result.status === 'success') {
          alert('Berhasil! Akun kamu telah dihapus secara permanen.');
          localStorage.removeItem('mogo_user');
          navigate('/login');
        } else {
          alert('Gagal menghapus akun: ' + result.message);
          setLoading(false);
        }
      } catch (err) {
        alert('Terjadi kesalahan jaringan saat menghapus akun.');
        setLoading(false);
      }
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Password baru dan konfirmasi password tidak cocok!");
      return;
    }

    setIsPasswordLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/users/${user.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const result = await res.json();

      if (result.status === 'success') {
        alert('Yeay! Password berhasil diperbarui.');
        setIsPasswordModalOpen(false);
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        alert(result.message);
      }
    } catch (err) {
      alert('Terjadi kesalahan saat mengubah password.');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 transition-all duration-500">
        <div className="text-6xl mb-4 animate-spin">⚙️</div>
        <p className="text-gray-800 font-extrabold text-2xl animate-pulse tracking-widest uppercase">Memuat Profil...</p>
      </div>
    );
  }

  const inisial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const totalAktivitas = logs.length;
  const userLevel = getGelarPetani(totalAktivitas);

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed font-sans relative selection:bg-green-200"
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
                <Link to="/planner" className="text-gray-500 hover:text-green-500 transition-colors pb-1">PLANNER AI</Link>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-11 h-11 rounded-full bg-green-50 border-2 border-green-500 text-green-700 flex items-center justify-center font-extrabold shadow-sm hover:scale-105 transition-transform focus:outline-none ring-4 ring-green-50 overflow-hidden"
                >
                  {user?.photo_url ? (
                    <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    inisial
                  )}
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-4 w-56 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden z-50 animate-fade-in-up">
                    <button 
                      onClick={() => { setIsDropdownOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="w-full flex items-center gap-3 text-left px-5 py-4 text-sm font-bold text-green-700 bg-green-50/50 transition-colors cursor-default"
                    >
                      <span className="text-lg">👤</span> Profil Saya
                    </button>
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

        <main className="max-w-5xl mx-auto px-6 py-12 md:py-16 flex flex-col gap-10">
          
          {/* HEADER PROFIL & STATISTIK */}
          <div className="bg-white/90 backdrop-blur-md rounded-4xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden">
            <div className="h-48 w-full bg-gray-200 overflow-hidden relative">
              {user?.banner_url ? (
                <img src={user.banner_url} alt="Banner Profil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-linear-to-r from-green-500 to-emerald-600"></div>
              )}
            </div>

            <div className="px-8 md:px-10 pb-8 relative">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                <div className="-mt-16 w-32 h-32 bg-white rounded-full p-2 shadow-md border-4 border-white z-10 shrink-0 overflow-hidden">
                  {user?.photo_url ? (
                    <img src={user.photo_url} alt="Foto Profil" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-emerald-50 rounded-full flex items-center justify-center text-5xl">👨‍🌾</div>
                  )}
                </div>

                <div className="flex-1 pt-2">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">{user?.name || 'Loading...'}</h1>
                  <p className="text-gray-500 font-medium mt-1 mb-4">{user?.email || 'Loading...'}</p>
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-sm uppercase tracking-wider ${userLevel.color}`}>
                    <span className="text-sm">{userLevel.icon}</span>
                    <span>{userLevel.gelar}</span>
                    <span className="bg-white/25 px-2 py-0.5 rounded-full text-[10px] ml-1 font-extrabold">Lv.{userLevel.level}</span>
                  </div>
                </div>

                <div className="pt-2 md:pt-4">
                  <button onClick={() => navigate('/profile/edit')} className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold px-6 py-3 rounded-xl transition-colors border border-gray-200 text-sm flex gap-2 items-center z-10 shadow-sm">
                    ✏️ Edit Profil
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100 bg-gray-50/50">
              <div className="p-6 text-center">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Tanaman Aktif</p>
                <p className="text-3xl font-black text-green-600">{stats.aktif}</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Panen</p>
                <p className="text-3xl font-black text-amber-500">{stats.panen} 🌾</p>
              </div>
              <div className="p-6 text-center">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Daily Streak</p>
                <p className="text-3xl font-black text-orange-500">{user?.streak || 0} 🔥</p>
              </div>
            </div>
          </div>

          {/* GUDANG PANEN */}
          <div className="bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-4xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">🏆 Gudang Panen</h2>
            
            {trophies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {trophies.map((trophy) => (
                  <div key={trophy.id} className="p-6 bg-linear-to-br from-amber-50/60 to-orange-50/60 border border-amber-100 rounded-3xl flex flex-col items-center text-center shadow-sm hover:scale-105 transition-transform cursor-default">
                    <span className="text-5xl mb-3 drop-shadow-sm">🌾</span>
                    <h3 className="font-extrabold text-amber-900 text-base mb-1">{trophy.name}</h3>
                    <div className="text-[10px] font-black text-amber-700 bg-amber-100 px-3 py-1 rounded-full uppercase tracking-wider">
                      Panen Sukses
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 opacity-60">
                <span className="text-6xl mb-4 grayscale">🌱</span>
                <p className="text-gray-600 font-extrabold text-lg">Belum Ada Hasil Panen</p>
                <p className="text-sm text-gray-400 mt-1 font-medium">Rawat tanamanmu dengan baik untuk memanen hasilnya di sini.</p>
              </div>
            )}
          </div>

          {/* SETTINGS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-4xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">⚙️ Preferensi</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800 text-base">Notifikasi Penyiraman</h3>
                    <p className="text-xs text-gray-500 font-medium">Ingatkan saya setiap pagi via Email</p>
                  </div>
                  <button onClick={() => setNotifSiram(!notifSiram)} className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${notifSiram ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`bg-white w-6 h-6 rounded-full shadow-sm transform transition-transform duration-300 ${notifSiram ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800 text-base">Saran AI Insight</h3>
                    <p className="text-xs text-gray-500 font-medium">Tampilkan rekomendasi di Dashboard</p>
                  </div>
                  <button onClick={() => setNotifAI(!notifAI)} className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${notifAI ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`bg-white w-6 h-6 rounded-full shadow-sm transform transition-transform duration-300 ${notifAI ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-4xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">🔒 Keamanan</h2>
              <div className="space-y-4">
                <button 
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="w-full flex justify-between items-center p-4 rounded-2xl border border-gray-100 hover:border-green-500 hover:bg-green-50/50 transition-all text-left group"
                >
                  <div>
                    <h3 className="font-bold text-gray-800 group-hover:text-green-700">Ubah Password</h3>
                    <p className="text-xs text-gray-500 font-medium">Perbarui kata sandi keamanan Anda</p>
                  </div>
                  <span className="text-gray-400 group-hover:text-green-500 font-bold">▶</span>
                </button>

                <button 
                  onClick={handleDeleteAccount}
                  className="w-full flex justify-between items-center p-4 rounded-2xl border border-red-50 hover:border-red-500 hover:bg-red-50/50 transition-all text-left group"
                >
                  <div>
                    <h3 className="font-bold text-red-600">Hapus Akun</h3>
                    <p className="text-xs text-red-400 font-medium">Tindakan ini permanen</p>
                  </div>
                  <span className="text-red-400 font-bold">⚠️</span>
                </button>
              </div>
            </div>
          </div>

        </main>

        {/* MODAL UBAH PASSWORD */}
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-4xl p-8 md:p-10 w-full max-w-md shadow-2xl animate-fade-in-up border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900">Ubah Password</h2>
                <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-red-500 font-extrabold text-2xl">&times;</button>
              </div>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Password Lama</label>
                  <input 
                    type="password" name="oldPassword" required
                    value={passwordForm.oldPassword} onChange={handlePasswordChange}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none font-medium"
                    placeholder="Masukkan password saat ini"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Password Baru</label>
                  <input 
                    type="password" name="newPassword" required minLength="6"
                    value={passwordForm.newPassword} onChange={handlePasswordChange}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none font-medium"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Konfirmasi Password Baru</label>
                  <input 
                    type="password" name="confirmPassword" required minLength="6"
                    value={passwordForm.confirmPassword} onChange={handlePasswordChange}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none font-medium"
                    placeholder="Ulangi password baru"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="flex-1 p-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold rounded-2xl transition-colors">
                    Batal
                  </button>
                  <button type="submit" disabled={isPasswordLoading} className="flex-1 p-4 bg-green-600 hover:bg-green-500 text-white font-extrabold rounded-2xl transition-colors shadow-md disabled:opacity-75">
                    {isPasswordLoading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Profile;