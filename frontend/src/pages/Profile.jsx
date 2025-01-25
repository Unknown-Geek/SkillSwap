import { useState, useEffect } from 'react';
import axios from 'axios';
import SkillInput from '../components/common/SkillInput';
import GithubGraph from '../components/common/GithubGraph';
import { toast } from 'react-hot-toast'; 
import { FaGithub } from 'react-icons/fa';
import { authApi, userApi } from '../utils/api';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No auth token');
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/users/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setProfile(response.data);
      setFormData(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No auth token');
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/me`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setProfile(response.data);
        setFormData(response.data);
        setIsEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleGithubLink = async () => {
    try {
      const response = await authApi.getGithubAuthUrl();
      const { authUrl } = response.data;

      const width = 600;
      const height = 800;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'GitHub Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      window.addEventListener('message', async function handleMessage(event) {
        if (event.data.type === 'github-linked') {
          window.removeEventListener('message', handleMessage);
          if (event.data.success) {
            await fetchProfile(); // Refresh profile data
            toast.success('GitHub account linked successfully!');
          } else {
            toast.error('Failed to link GitHub account');
          }
          popup.close();
        }
      });
    } catch (err) {
      console.error('GitHub auth error:', err);
      toast.error('Failed to initialize GitHub connection');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        Profile not found
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Profile
            </h1>
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isEditing ? "Save Changes" : "Edit Profile"}
            </button>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Username</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="mt-1 w-full px-4 py-2 border rounded-lg dark:bg-gray-700"
                  />
                ) : (
                  <p className="mt-1 text-lg font-medium">{profile.username}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                <p className="mt-1 text-lg font-medium">{profile.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Karma Points</label>
                <p className="mt-1 text-lg font-medium">{profile.karma_points}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</label>
                <p className="mt-1 text-lg font-medium">
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Skills Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Skills Offered
                  </label>
                  {isEditing ? (
                  <SkillInput
                    skills={formData.skills_offered}
                    onChange={(newSkills) => 
                    setFormData(prev => ({ ...prev, skills_offered: newSkills }))
                    }
                    placeholder="Search skills to offer..."
                    bgColor="blue"
                  />
                  ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.skills_offered.map((skill, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900 rounded-lg"
                    >
                      <span className="text-sm font-medium">{skill}</span>
                    </div>
                    ))}
                  </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Skills Needed
                  </label>
                  {isEditing ? (
                  <SkillInput
                    skills={formData.skills_needed}
                    onChange={(newSkills) => 
                    setFormData(prev => ({ ...prev, skills_needed: newSkills }))
                    }
                    placeholder="Search skills to learn..."
                    bgColor="green"
                  />
                  ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.skills_needed.map((skill, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900 rounded-lg"
                    >
                      <span className="text-sm font-medium">{skill}</span>
                    </div>
                    ))}
                  </div>
                  )}
                </div>
                </div>

                {/* Progress Section */}
          {Object.keys(profile.skill_progress).length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Skill Progress</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(profile.skill_progress).map(([skill, progress], index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">{skill}</span>
                      <span className="text-sm font-medium">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GitHub Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">GitHub Integration</h2>
              {profile.github_connected ? (
                <span className="text-green-500 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Connected as {profile.github_username}
                </span>
              ) : (
                <button
                  onClick={handleGithubLink}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
                  </svg>
                  Connect GitHub
                </button>
              )}
            </div>
            
            {profile.github_connected && (
              <GithubGraph username={profile.github_username} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;