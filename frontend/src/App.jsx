import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Chat from "./pages/Chat";
import { LoginForm, RegisterForm, AuthCallback } from './components/auth';

const App = () => (
  <Router>
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/users" element={<Users />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/auth/callback/:provider" element={<AuthCallback />} />
      </Routes>
    </div>
  </Router>
);

export default App;
