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

function Dashboard() {
  const [user, setUser] = useState(null);
  const [plants, setPlants] = useState([]);
  const [trophies, setTrophies] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  
  const [showAIInsight, setShowAIInsight] = useState(() => {
    const saved = localStorage.getItem('mogo_pref_ai');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const savedUser = localStorage.getItem('mogo_user');
  const userStorage = savedUser ? JSON.parse(savedUser) : {};
  const namaUser = userStorage.name || 'Fadhil Wibowo';
  const inisial = namaUser.charAt(0).toUpperCase(); 
  const USER_ID = userStorage.id || 1;

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/dashboard/${USER_ID}`);
      const result = await res.json();
      if (result.status === 'success') {
        setUser(result.data.user);
        setPlants(result.data.plants || []);
        setTrophies(result.data.trophies || []);
        setTasks(result.data.tasks || []);
      }

      const resLog = await fetch(`http://localhost:3000/api/logs/${USER_ID}`);
      const resultLog = await resLog.json();
      if (resultLog.status === 'success') setLogs(resultLog.data);
      
    } catch (err) {
      console.error("Gagal ambil data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const savedAI = localStorage.getItem('mogo_pref_ai');
    if (savedAI !== null) setShowAIInsight(JSON.parse(savedAI));
  }, []);

  const handleTaskCheck = async (taskId, isCompleted) => {
    if (isCompleted) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: true } : t));
    try {
      const res = await fetch(`http://localhost:3000/api/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID })
      });
      const result = await res.json();
      if (result.status === 'success') fetchDashboardData();
    } catch (err) {
      alert("Gagal menyimpan aktivitas.");
    }
  };

  const handleDeletePlant = async (plantId, plantName) => {
    if (!window.confirm(`🗑️ Yakin mau mencabut "${plantName}" dari kebun?`)) return;
    try {
      const res = await fetch(`http://localhost:3000/api/plants/${plantId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.status === 'success') fetchDashboardData();
    } catch (err) { alert("Terjadi kesalahan sistem."); }
  };

  const handleHarvestPlant = async (plantId, plantName) => {
    try {
      const res = await fetch(`http://localhost:3000/api/plants/${plantId}/harvest`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID })
      });
      const result = await res.json();
      if (result.status === 'success') {
        fetchDashboardData();
        alert(`🎉 Selamat! Kamu berhasil memanen ${plantName}! Cek di Gudang Panen.`);
      }
    } catch (err) { alert("Gagal melakukan panen."); }
  };

  const handleLogout = () => {
    localStorage.removeItem('mogo_user');
    navigate('/login');
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const getPlantEvolution = (currentDay, targetDays, health) => {
    if (health <= 0) return { icon: '🥀', text: 'Tanaman Mati', color: 'bg-gray-100', textCol: 'text-gray-500', animation: '' };
    if (!targetDays || targetDays === 0) return { icon: '🌱', text: 'Menunggu tumbuh', color: 'bg-green-50', textCol: 'text-green-600', animation: 'animate-pulse' };
    
    const percent = Math.min(100, Math.round((currentDay / targetDays) * 100));
    if (percent < 20) return { icon: '🌰', text: 'Fase Biji & Kecambah', color: 'bg-amber-50', textCol: 'text-amber-700', animation: 'animate-pulse' };
    if (percent < 50) return { icon: '🌱', text: 'Tunas Muda Muncul', color: 'bg-lime-50', textCol: 'text-lime-700', animation: 'animate-bounce' };
    if (percent < 100) return { icon: '🌿', text: 'Daun Semakin Rimbun', color: 'bg-green-100', textCol: 'text-green-800', animation: 'animate-pulse' };
    return { icon: '🌾', text: 'Wah, Siap Dipanen!', color: 'bg-yellow-100', textCol: 'text-yellow-700', animation: 'animate-bounce' };
  };

  const groupedLogs = logs.reduce((acc, log) => {
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date(log.created_at).toLocaleDateString('id-ID', dateOptions);
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(log);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 transition-all duration-500">
        <div className="text-6xl mb-4 animate-spin">🌱</div>
        <p className="text-gray-800 font-extrabold text-2xl animate-pulse tracking-widest uppercase">Menyiapkan Kebunmu...</p>
      </div>
    );
  }

  const isFrozen = user?.is_frozen || false; 
  const totalAktivitas = logs.length;
  const userLevel = getGelarPetani(totalAktivitas);

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
            <div className="text-2xl font-extrabold tracking-widest cursor-pointer hover:scale-105 transition-transform" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              MOGO<span className="text-green-600">.</span>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="hidden md:flex gap-8 text-sm font-bold tracking-widest uppercase">
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-green-600 border-b-2 border-green-600 pb-1">Dashboard</button>
                <Link to="/planner" className="text-gray-500 hover:text-green-500 transition-colors pb-1">Planner AI</Link>
                <button onClick={() => scrollToSection('about')} className="text-gray-500 hover:text-green-500 transition-colors pb-1">ABOUT</button>
                <button onClick={() => scrollToSection('contact')} className="text-gray-500 hover:text-green-500 transition-colors pb-1">CONTACT</button>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-11 h-11 rounded-full bg-green-50 border-2 border-green-500 text-green-700 flex items-center justify-center font-extrabold shadow-sm hover:scale-105 transition-transform focus:outline-none ring-4 ring-green-50"
                >
                  {user?.photo_url ? (
                    <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover rounded-full" />
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

        <main className="max-w-7xl mx-auto px-6 py-12 md:py-16">
          
          {/* WIDGET AI INSIGHT */}
          {showAIInsight && (
            <div className="mb-12 w-full bg-linear-to-r from-emerald-50/90 to-teal-50/90 backdrop-blur-md border border-emerald-100 shadow-sm hover:shadow-md transition-shadow rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in-up">
              <div className="flex items-center gap-5 text-gray-800">
                <div className="text-5xl md:text-6xl drop-shadow-sm">🤖</div>
                <div>
                  <h3 className="font-extrabold text-xl md:text-2xl mb-1.5 tracking-wide text-emerald-800">MOGO AI Insight</h3>
                  <p className="text-sm md:text-base font-medium text-emerald-700 max-w-2xl">Cuaca bulan ini cukup lembap. AI kami menyarankan menanam <strong className="text-emerald-900">Sawi Pakcoy</strong> untuk hasil panen yang lebih cepat dan optimal.</p>
                </div>
              </div>
              <Link to="/planner" className="bg-emerald-600 text-white hover:bg-emerald-500 font-extrabold px-8 py-3.5 rounded-full text-sm shadow-md hover:shadow-lg whitespace-nowrap transition-all active:scale-95">
                Analisis Tanaman Lain
              </Link>
            </div>
          )}

          {/* HEADER & STREAK */}
          <div className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 text-gray-900">
                Hello, {namaUser}.
              </h1>
              <p className="text-lg md:text-xl text-gray-500 font-medium mb-8">Siap merawat kebun kecilmu hari ini?</p>
              
              <div className="inline-flex flex-col items-start">
                <span className="text-xs font-extrabold text-gray-400 mb-2 uppercase tracking-widest">Level Pengguna</span>
                <div className={`flex items-center gap-2.5 text-white px-6 py-3 rounded-full shadow-md ${userLevel.color} hover:-translate-y-0.5 transition-transform`}>
                  <span className="text-2xl drop-shadow-sm">{userLevel.icon}</span>
                  <span className="font-extrabold tracking-wide text-lg">{userLevel.gelar}</span>
                  <span className="bg-white/20 px-2.5 py-1 rounded-full text-xs ml-2 font-extrabold shadow-inner">Lv.{userLevel.level}</span>
                </div>
              </div>
            </div>
            
            <div className={`bg-white/90 backdrop-blur-md border ${isFrozen ? 'border-blue-200 shadow-blue-100' : 'border-gray-100'} shadow-xl shadow-gray-200/40 px-12 py-8 rounded-4xl text-center shrink-0 mt-6 md:mt-0 relative overflow-hidden group`}>
              <div className="absolute inset-0 bg-linear-to-br from-transparent to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="text-5xl block mb-3 animate-bounce relative z-10">{isFrozen ? '🧊' : '🔥'}</span>
              <p className={`text-xs font-extrabold uppercase tracking-widest mb-2 relative z-10 ${isFrozen ? 'text-blue-500' : 'text-green-500'}`}>{isFrozen ? 'Streak Membeku' : 'Daily Streak'}</p>
              <p className="text-5xl font-black leading-none text-gray-800 relative z-10">{user?.streak || 0} <span className="text-2xl text-gray-400 font-bold">Hari</span></p>
            </div>
          </div>

          {/* GRID KEBUN & MISI */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            
            {/* KEBUN SAYA */}
            <div className="lg:col-span-7 bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-4xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">🌿 Kebun Saya</h2>
                <span className="bg-green-50 text-green-700 text-sm font-extrabold px-4 py-1.5 rounded-full ring-1 ring-green-200/50">{plants.length} Tanaman</span>
              </div>
              
              <div className="space-y-6 flex-1">
                {plants.length > 0 ? plants.map(plant => {
                  const currentHealth = plant.health ?? 100;
                  const persentase = Math.min(100, Math.round((plant.current_day / plant.target_days) * 100));
                  const evolusi = getPlantEvolution(plant.current_day, plant.target_days, currentHealth);
                  const isReadyToHarvest = plant.current_day >= plant.target_days && currentHealth > 0;
                  
                  let healthColor = "bg-green-500";
                  if (currentHealth <= 50) healthColor = "bg-yellow-400";
                  if (currentHealth <= 20) healthColor = "bg-red-500";

                  return (
                    <div key={plant.id} className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                      <button onClick={() => handleDeletePlant(plant.id, plant.name)} className="absolute top-4 right-4 z-20 text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all bg-white p-2.5 rounded-xl opacity-0 group-hover:opacity-100 shadow-sm border border-gray-100" title="Cabut Tanaman">🗑️</button>
                      
                      <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                        <div className={`w-24 h-24 shrink-0 rounded-2xl flex items-center justify-center text-5xl shadow-inner border border-white/50 ${evolusi.color}`}>
                          <div className={evolusi.animation}>{evolusi.icon}</div>
                        </div>
                        
                        <div className="flex-1 w-full sm:pr-8">
                          <h3 className="font-extrabold text-gray-800 text-2xl mb-1.5">{plant.name}</h3>
                          <p className={`text-sm font-bold mb-4 ${evolusi.textCol}`}>{evolusi.text}</p>
                          
                          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2 overflow-hidden shadow-inner">
                            <div className="bg-linear-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${persentase}%` }}></div>
                          </div>
                          
                          <div className="flex justify-between items-center mb-4 text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
                            <span>Hari {plant.current_day}</span>
                            <span>Target: {plant.target_days} Hari</span>
                          </div>

                          <div className="flex items-center gap-3 mt-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                            <span className="text-xs font-black text-gray-600 w-12">❤️ {currentHealth}%</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
                              <div className={`${healthColor} h-full rounded-full transition-all duration-500`} style={{ width: `${currentHealth}%` }}></div>
                            </div>
                          </div>
                          
                          {isReadyToHarvest && (
                            <button 
                              onClick={() => handleHarvestPlant(plant.id, plant.name)}
                              className="mt-5 w-full bg-linear-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-lg shadow-amber-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2 animate-bounce"
                            >
                              <span className="text-lg">🌾</span> PANEN SEKARANG!
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="h-full min-h-62.5 flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-gray-200 rounded-4xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <span className="text-6xl opacity-40 block mb-4 grayscale">🪴</span>
                    <p className="text-gray-500 font-extrabold text-lg">Kebun masih kosong.</p>
                    <Link to="/planner" className="text-green-600 text-sm font-bold hover:text-green-500 mt-2 bg-green-50 px-4 py-2 rounded-lg transition-colors">🔍 Cari tanaman di Planner AI</Link>
                  </div>
                )}
              </div>
            </div>

            {/* MISI HARI INI */}
            <div className="lg:col-span-5 bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-4xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 flex flex-col">
              <h2 className="text-3xl font-extrabold text-gray-800 mb-8 flex items-center gap-3">📝 Misi Harian</h2>
              <div className="space-y-4 flex-1">
                {tasks.length > 0 ? tasks.map(task => (
                  <label key={task.id} className={`flex items-start p-5 rounded-2xl border-2 transition-all cursor-pointer group ${task.is_completed ? 'bg-green-50/50 border-green-200' : 'bg-white border-gray-100 hover:border-green-300 hover:shadow-sm'}`}>
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input type="checkbox" className="w-6 h-6 rounded-lg border-2 border-gray-300 text-green-500 focus:ring-green-500 focus:ring-offset-0 transition-all cursor-pointer group-hover:border-green-400" checked={task.is_completed} onChange={() => handleTaskCheck(task.id, task.is_completed)} />
                    </div>
                    <span className={`ml-4 font-bold text-[15px] leading-relaxed ${task.is_completed ? 'line-through text-green-600/70' : 'text-gray-700'}`}>{task.task_text}</span>
                  </label>
                )) : (
                  <div className="h-full min-h-62.5 flex flex-col items-center justify-center text-center p-10 bg-gray-50/50 rounded-4xl border border-gray-100">
                    <span className="text-6xl mb-4 drop-shadow-md">✅</span>
                    <p className="text-gray-700 font-extrabold text-lg">Semua misi beres!</p>
                    <p className="text-sm text-gray-500 mt-2 font-medium">Kamu sudah jadi pahlawan hijau hari ini.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* GUDANG PANEN */}
          {trophies.length > 0 && (
            <div className="mt-12 bg-linear-to-br from-white/90 to-amber-50/70 backdrop-blur-md p-8 md:p-10 rounded-4xl shadow-sm hover:shadow-md transition-shadow border border-amber-200/60">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                <h2 className="text-3xl font-extrabold text-amber-900">🏆 Gudang Panen</h2>
                <span className="bg-amber-500 text-white text-sm font-extrabold px-4 py-1.5 rounded-full shadow-sm w-fit">{trophies.length} Berhasil Panen</span>
              </div>
              <div className="flex overflow-x-auto gap-6 pb-6 custom-scrollbar snap-x">
                {trophies.map(trophy => (
                  <div key={trophy.id} className="snap-start min-w-60 bg-white border border-amber-100 p-6 rounded-3xl shadow-sm hover:-translate-y-1 hover:shadow-md transition-all text-center group cursor-default">
                    <div className="w-20 h-20 mx-auto bg-amber-50 rounded-full flex items-center justify-center text-4xl mb-4 border-4 border-amber-100 group-hover:scale-110 transition-transform">
                      🌾
                    </div>
                    <h3 className="font-extrabold text-gray-800 text-xl mb-1">{trophy.name}</h3>
                    <p className="text-xs font-black text-amber-600 uppercase tracking-widest">Panen Sukses</p>
                    <div className="mt-4 pt-4 border-t border-gray-50">
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Waktu Tumbuh</p>
                      <p className="text-sm font-black text-gray-700">{trophy.target_days} Hari</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* JURNAL AKTIVITAS */}
          <div className="mt-12 bg-white/90 backdrop-blur-md p-8 md:p-10 rounded-4xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <h2 className="text-3xl font-extrabold text-gray-800 mb-8 flex items-center gap-3">🗂️ Jurnal Aktivitas Harian</h2>
            <div className="bg-gray-50/50 rounded-3xl p-6 md:p-8 border border-gray-100 h-100 overflow-y-auto custom-scrollbar">
              {Object.keys(groupedLogs).length > 0 ? (
                <div className="space-y-10">
                  {Object.entries(groupedLogs).map(([date, dailyLogs]) => (
                    <div key={date}>
                      <div className="sticky top-0 bg-gray-50/90 backdrop-blur-md py-3 z-10 mb-5 flex items-center gap-4">
                        <h3 className="text-sm font-black text-green-700 uppercase tracking-widest bg-green-100/50 px-4 py-1.5 rounded-full">{date}</h3>
                        <div className="flex-1 h-px bg-green-100"></div>
                      </div>
                      <ul className="space-y-5 border-l-2 border-green-200 ml-4">
                        {dailyLogs.map((log) => (
                          <li key={log.id} className="relative pl-8 hover:bg-white p-3 -ml-3 rounded-xl transition-colors group">
                            <span className="absolute left-0.75 top-4 w-3.5 h-3.5 bg-green-500 rounded-full ring-4 ring-gray-50 group-hover:ring-white transition-all shadow-sm"></span>
                            <p className="font-bold text-gray-800 text-[15px]">{log.action_text}</p>
                            <p className="text-xs text-gray-400 font-bold mt-1.5 flex items-center gap-1.5">
                              <span className="opacity-70">🕒</span> {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-60">
                  <span className="text-5xl mb-4 grayscale">📭</span>
                  <p className="text-gray-500 font-bold text-lg">Belum ada jurnal tercatat.</p>
                </div>
              )}
            </div>
          </div>

          {/* ABOUT SECTION */}
          <section id="about" className="mt-32 pt-16 border-t border-gray-100/80 scroll-mt-24">
            <h2 className="text-4xl font-extrabold mb-10 text-gray-800 text-center">About MOGO.</h2>
            <div className="bg-white/90 backdrop-blur-md p-10 md:p-16 rounded-4xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
              <p className="text-lg md:text-xl leading-relaxed text-gray-600 text-center font-medium">
                "MOGO hadir sebagai solusi Smart Urban Farming yang mengubah cara masyarakat perkotaan berkebun. Dengan memadukan Machine Learning untuk rekomendasi tanam presisi dan sistem Gamifikasi interaktif, MOGO memandu Anda membangun kebiasaan merawat tanaman secara konsisten guna mewujudkan ketahanan pangan mandiri langsung dari rumah."
              </p>
            </div>
          </section>

          {/* CONTACT SECTION */}
          <section id="contact" className="mt-20 pt-16 pb-20 border-t border-gray-100/80 scroll-mt-24">
            <h2 className="text-4xl font-extrabold mb-10 text-gray-800 text-center">Contact Us.</h2>
            <div className="bg-white/90 backdrop-blur-md p-10 md:p-14 rounded-4xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-12 justify-center max-w-4xl mx-auto">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-extrabold mb-4 text-green-600">Punya Pertanyaan?</h3>
                <p className="text-gray-500 mb-10 text-lg font-medium">Hubungi pengembang MOGO untuk Kritik dan Saran serta Kolaborasi.</p>
                <div className="space-y-6 text-gray-700 font-bold text-lg flex flex-col items-center md:items-start">
                  
                  {/* Email */}
                  <a href="mailto:fadhilahsetyo25@gmail.com" className="flex items-center gap-5 hover:text-green-600 transition-all w-fit group hover:translate-x-2">
                    <span className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-800 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z"/></svg>
                    </span>
                    fadhilahsetyo25@gmail.com
                  </a>

                  {/* Lokasi */}
                  <div className="flex items-center gap-5 w-fit group">
                    <span className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-800 group-hover:bg-green-50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/></svg>
                    </span>
                    Purbalingga, Jawa Tengah
                  </div>

                  {/* GitHub */}
                  <a href="https://github.com/fadhilarse" target="_blank" rel="noopener noreferrer" className="flex items-center gap-5 hover:text-green-600 transition-all w-fit group hover:translate-x-2">
                    <span className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-800 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
                    </span>
                    github.com/fadhilarse
                  </a>
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

export default Dashboard;