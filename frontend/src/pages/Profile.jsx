import { useState, useEffect } from "react";
import axios from "axios";

const Profile = () => {
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    skills_offered: [],
    skills_needed: [],
    karma_points: 0,
    skill_progress: {}
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    skills_offered: [],
    skills_needed: []
  });

  useEffect(() => {
    axios.get("http://localhost:5000/api/users/me", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => {
        setProfile(response.data);
        setFormData(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        setError("Failed to load profile");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:5000/api/users/${profile._id}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setProfile(formData);
      setIsEditing(false);
    } catch (error) {
      setError("Failed to save changes");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return <div className="text-center mt-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-center mt-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Profile</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Username</h2>
          {isEditing ? (
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          ) : (
            <p className="text-gray-600 dark:text-gray-300">{profile.username}</p>
          )}
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold">Email</h2>
          {isEditing ? (
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          ) : (
            <p className="text-gray-600 dark:text-gray-300">{profile.email}</p>
          )}
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold">Skills Offered</h2>
          {isEditing ? (
            <input
              type="text"
              name="skills_offered"
              value={formData.skills_offered.join(", ")}
              onChange={(e) => handleChange({ target: { name: "skills_offered", value: e.target.value.split(", ") } })}
              className="w-full p-2 border rounded"
            />
          ) : (
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
              {profile.skills_offered.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold">Skills Needed</h2>
          {isEditing ? (
            <input
              type="text"
              name="skills_needed"
              value={formData.skills_needed.join(", ")}
              onChange={(e) => handleChange({ target: { name: "skills_needed", value: e.target.value.split(", ") } })}
              className="w-full p-2 border rounded"
            />
          ) : (
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
              {profile.skills_needed.map((skill, index) => (
                <li key={index}>{skill}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold">Karma Points</h2>
          <p className="text-gray-600 dark:text-gray-300">{profile.karma_points}</p>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold">Skill Progress</h2>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
            {Object.entries(profile.skill_progress).map(([skill, progress], index) => (
              <li key={index}>{skill}: {progress}%</li>
            ))}
          </ul>
        </div>

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? "Save Changes" : "Edit Profile"}
        </button>
      </div>
    </div>
  );
};

export default Profile;