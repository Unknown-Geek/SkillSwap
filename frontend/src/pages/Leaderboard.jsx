import { useState, useEffect } from "react";
import axios from "axios";

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/leaderboard")
      .then(response => {
        setUsers(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        setError("Failed to load leaderboard");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center mt-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Leaderboard</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <ul className="list-decimal list-inside text-gray-600 dark:text-gray-300">
          {users.map((user, index) => (
            <li key={index} className="mb-2">
              {user.username} - {user.karma_points} points
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Leaderboard;
