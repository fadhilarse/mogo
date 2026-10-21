import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-emerald-600 shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-white tracking-wide">MOGO 🌱</span>
          </Link>

          {/* Menu Navigasi */}
          <div className="flex space-x-6">
            <Link 
              to="/" 
              className={`font-semibold transition-colors ${location.pathname === '/' ? 'text-white' : 'text-emerald-200 hover:text-white'}`}
            >
              Beranda
            </Link>
            <Link 
              to="/planner" 
              className={`font-semibold transition-colors ${location.pathname === '/planner' ? 'text-white' : 'text-emerald-200 hover:text-white'}`}
            >
              Coba Planner
            </Link>
          </div>
          
        </div>
      </div>
    </nav>
  );
}

export default Navbar;