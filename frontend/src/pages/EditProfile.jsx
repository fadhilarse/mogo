import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/bg-mogo.jpg';

function EditProfile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    photo_url: '',
    banner_url: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('mogo_user');
    if (!savedUser) {
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(savedUser);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      photo_url: user.photo_url || '',
      banner_url: user.banner_url || ''
    });
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) {
        alert("Ukuran gambar terlalu besar! Maksimal 2MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const savedUser = JSON.parse(localStorage.getItem('mogo_user'));
      
      const res = await fetch(`http://localhost:3000/api/users/${savedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          photo_url: formData.photo_url,
          banner_url: formData.banner_url
        })
      });

      const result = await res.json();

      if (result.status === 'success') {
        const updatedUser = { ...savedUser, ...result.data };
        localStorage.setItem('mogo_user', JSON.stringify(updatedUser));
        
        alert('Profil dan Banner berhasil diperbarui!');
        navigate('/profile'); 
      } else {
        alert('Gagal update di server: ' + result.message);
      }
      
    } catch (error) {
      console.error('Gagal menyimpan profil', error);
      alert('Terjadi kesalahan saat menyimpan data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed py-12 px-6 flex items-center justify-center font-sans selection:bg-green-200 relative overflow-hidden"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Overlay Gradasi Putih Transparan */}
      <div className="fixed inset-0 bg-linear-to-br from-white/90 via-white/80 to-white/90 backdrop-blur-sm z-0 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-lg bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-4xl shadow-xl border border-white/50">
        
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-extrabold text-gray-900">✏️ Edit Profil</h2>
          <button onClick={() => navigate('/profile')} className="text-gray-400 hover:text-red-500 font-extrabold text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Nama Lengkap</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className="w-full p-4 bg-white/70 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 font-medium text-gray-800 transition-all"
              placeholder="Masukkan nama kamu"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Foto Profil (Avatar)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'photo_url')}
              className="w-full p-3 bg-white/70 border border-gray-200 rounded-2xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-green-100 file:text-green-700 hover:file:bg-green-200 transition-all cursor-pointer font-medium text-gray-600"
            />
            {formData.photo_url && formData.photo_url.startsWith('data:image') && (
              <p className="text-xs text-green-600 mt-2 font-bold">✔️ Foto profil siap disimpan!</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Banner Profil</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'banner_url')}
              className="w-full p-3 bg-white/70 border border-gray-200 rounded-2xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-green-100 file:text-green-700 hover:file:bg-green-200 transition-all cursor-pointer font-medium text-gray-600"
            />
            {formData.banner_url && formData.banner_url.startsWith('data:image') && (
              <p className="text-xs text-green-600 mt-2 font-bold">✔️ Banner siap disimpan!</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={() => navigate('/profile')}
              className="flex-1 p-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold rounded-2xl transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 p-4 bg-green-600 hover:bg-green-500 text-white font-extrabold rounded-2xl transition-colors shadow-md disabled:opacity-75"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default EditProfile;