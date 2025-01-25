import { useCallback } from 'react';
import { FaGithub } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { authApi } from '../../utils/api';
import GithubGraph from '../github/GithubGraph';

const GithubIntegration = ({ profile, onProfileUpdate }) => {
  const handleGithubLink = useCallback(async () => {
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
            await onProfileUpdate();
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
  }, [onProfileUpdate]);

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6">
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
            <FaGithub className="w-5 h-5" />
            Connect GitHub
          </button>
        )}
      </div>
      
      {profile.github_connected && (
        <GithubGraph username={profile.github_username} />
      )}
    </div>
  );
};

export default GithubIntegration;
