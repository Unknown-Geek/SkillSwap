// src/components/common/Navbar.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="glass-effect fixed w-full top-0 z-50 shadow-sm">
      <div className="flex justify-between items-center max-w-6xl mx-auto px-4 py-3">
        <Link to="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
          SkillSwap
        </Link>
        
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link to="/profile" className="nav-link">Profile</Link>
              <Link to="/users" className="nav-link">Users</Link>
              <Link to="/leaderboard" className="nav-link">Leaderboard</Link>
              <Link to="/chat" className="nav-link">Chat</Link>
              <button onClick={logout} className="nav-link">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Register
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;