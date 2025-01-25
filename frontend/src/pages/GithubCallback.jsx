import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userApi } from '../utils/api';

const GithubCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      userApi.linkGithub(code)
        .then(() => {
          window.opener.postMessage({ type: 'github-linked', success: true }, '*');
          window.close();
        })
        .catch((error) => {
          console.error('GitHub linking error:', error);
          window.opener.postMessage({ type: 'github-linked', success: false }, '*');
          window.close();
        });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
    </div>
  );
};

export default GithubCallback;
