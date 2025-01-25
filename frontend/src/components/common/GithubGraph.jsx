import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { userApi } from '../../utils/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`);
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load users");
        toast.error("Could not load users");
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center text-red-500">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
          Community Members
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div 
              key={user._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {user.username}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Karma: {user.karma_points}
                  </p>
                </div>
              </div>

              {user.skills_offered?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Skills Offered
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user.skills_offered.map((skill, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {user.skills_needed?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Skills Seeking
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user.skills_needed.map((skill, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Link
                  to={`/chat?user=${user._id}`}
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Start Chat
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const GithubGraph = ({ username }) => {
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGithubActivity = async () => {
      try {
        const response = await userApi.getGithubActivity();
        setActivity(response.data);
      } catch (err) {
        setError('Failed to load GitHub activity');
        console.error('GitHub activity error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchGithubActivity();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 text-center">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold mb-4">GitHub Activity</h3>
      {activity ? (
        <div className="space-y-4">
          {/* Display activity data here */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Recent contributions: {activity.totalContributions || 0}
          </p>
          {/* Add more activity visualization as needed */}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No GitHub activity available</p>
      )}
    </div>
  );
};

export default GithubGraph;