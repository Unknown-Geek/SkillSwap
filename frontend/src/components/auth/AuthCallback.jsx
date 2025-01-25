import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../utils/api';
import { toast } from 'react-hot-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        if (!code) {
          throw new Error('No authorization code received');
        }

        const response = await authApi.handleCallback(provider, code);
        
        if (response.data.token && response.data.user) {
          login(response.data.token, response.data.user);
          toast.success('Successfully connected with GitHub');
          navigate('/profile');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Failed to connect with GitHub');
        navigate('/profile');
      }
    };

    handleCallback();
  }, [provider, navigate, login, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
    </div>
  );
};

export default AuthCallback;