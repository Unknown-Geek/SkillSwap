import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const isAuthenticated = false; // TODO: Replace with actual auth state

  return (
    <nav className="backdrop-blur-md bg-white/70 dark:bg-gray-900/80 fixed w-full top-0 z-50 shadow-sm">
      <div className="flex justify-between items-center max-w-6xl mx-auto px-4 py-3">
        <Link to="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
          SkillSwap
        </Link>
        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              {['Profile', 'Users', 'Leaderboard', 'Chat'].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
                >
                  {item}
                </Link>
              ))}
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200">
                Login
              </Link>
              <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
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
