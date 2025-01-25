import { useState, useEffect } from 'react';
import axios from 'axios';
import SkillInput from '../components/common/SkillInput';

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
        </div>
      </div>
    </div>
  );
};

export default Profile;