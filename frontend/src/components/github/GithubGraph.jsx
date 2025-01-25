import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { userApi } from '../../utils/api';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

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
  const [commitData, setCommitData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchGithubData = async () => {
      try {
        setLoading(true);
        // Fetch activity
        const activityResponse = await userApi.getGithubActivity();
        setActivity(activityResponse.data);

        // Fetch commit data
        const today = new Date();
        const startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - 12);
        
        const commitsUrl = `https://api.github.com/users/${username}/events/public`;
        const commitsResponse = await fetch(commitsUrl);
        const eventsData = await commitsResponse.json();
        
        // Process commit data for heatmap
        const commitCounts = {};
        eventsData.forEach(event => {
          if (event.type === 'PushEvent') {
            const date = event.created_at.split('T')[0];
            commitCounts[date] = (commitCounts[date] || 0) + event.payload.commits.length;
          }
        });

        const heatmapData = Object.entries(commitCounts).map(([date, count]) => ({
          date,
          count
        }));

        setCommitData(heatmapData);
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Failed to load GitHub data';
        toast.error(errorMessage);
        console.error('GitHub data error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchGithubData();
    }
  }, [username]);

  return (
    <div className="space-y-6">
      {/* Commit Heatmap */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Contribution History</h3>
        <div className="overflow-x-auto">
          <CalendarHeatmap
            startDate={new Date('2023-01-01')}
            endDate={new Date('2023-12-31')}
            values={commitData}
            classForValue={(value) => {
              if (!value) return 'color-empty';
              const count = value.count;
              if (count > 6) return 'color-scale-4';
              if (count > 4) return 'color-scale-3';
              if (count > 2) return 'color-scale-2';
              return 'color-scale-1';
            }}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
        {loading ? (
          <div className="flex justify-center items-center p-4">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : !activity ? (
          <div className="text-center text-gray-500 dark:text-gray-400 p-4">
            No GitHub activity available
          </div>
        ) : (
          <div className="space-y-4">
            {activity.slice(0, 5).map((event, index) => (
              <div key={event.id || index} className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm">
                    {formatGithubEvent(event)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(event.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom styles for the heatmap */}
      <style jsx>{`
        .react-calendar-heatmap text {
          font-size: 10px;
          fill: #aaa;
        }
        .react-calendar-heatmap .color-empty {
          fill: #eeeeee;
        }
        .react-calendar-heatmap .color-scale-1 {
          fill: #9be9a8;
        }
        .react-calendar-heatmap .color-scale-2 {
          fill: #40c463;
        }
        .react-calendar-heatmap .color-scale-3 {
          fill: #30a14e;
        }
        .react-calendar-heatmap .color-scale-4 {
          fill: #216e39;
        }
      `}</style>
    </div>
  );
};

const formatGithubEvent = (event) => {
  switch (event.type) {
    case 'PushEvent':
      return `Pushed to ${event.repo.name}`;
    case 'CreateEvent':
      return `Created ${event.payload.ref_type} ${event.repo.name}`;
    case 'PullRequestEvent':
      return `${event.payload.action} pull request in ${event.repo.name}`;
    default:
      return `Activity in ${event.repo.name}`;
  }
};

export default GithubGraph;