import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import bgImage from '../assets/bg-mogo.jpg'; // <-- Import gambar background

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.status === 'success') {
        localStorage.setItem('mogo_user', JSON.stringify(data.data));
        navigate('/dashboard');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-6 font-sans selection:bg-green-200 relative overflow-hidden"
      style={{ backgroundImage: `url(${bgImage})` }} 
    >
      
      {/* Overlay Gradasi Putih Semi Transparan */}
      <div className="absolute inset-0 bg-linear-to-br from-white/90 via-white/70 to-white/90 backdrop-blur-sm z-0"></div>

      {/* Dekorasi Background Halus (Biar makin estetik) */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-green-300/30 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none z-0"></div>

      {/* Card Form */}
      <div className="relative z-10 bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 w-full max-w-md border border-white/50">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-2 tracking-wider">
            MOGO<span className="text-green-600">.</span>
          </h1>
          <p className="text-gray-500 font-bold text-sm">Masuk untuk pantau kebunmu</p>
        </div>

        {error && (
          <div className="bg-red-50/90 border border-red-100 text-red-600 px-4 py-3.5 rounded-2xl mb-6 text-sm font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none bg-white/70 text-gray-800 font-medium placeholder-gray-400 transition-all"
              placeholder="Masukan email anda"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none bg-white/70 text-gray-800 font-medium placeholder-gray-400 transition-all"
              placeholder="Masukan password anda"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-extrabold py-4 rounded-2xl transition-all shadow-lg shadow-green-600/25 transform active:scale-95 mt-2 disabled:opacity-75"
          >
            {loading ? 'MEMPROSES...' : 'MASUK KE DASHBOARD'}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-8 font-bold text-sm">
          Belum punya akun?{' '}
          <Link to="/register" className="text-green-600 hover:text-green-500 hover:underline transition-colors">
            Daftar di sini
          </Link>
        </p>
      </div>
    </div>
  );
}