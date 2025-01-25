import { useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { provider } = useParams();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      
      if (!code) {
        navigate('/login?error=missing_code');
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/${provider}/callback`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code })
          }
        );
        
        if (!response.ok) {
          throw new Error('Authentication failed');
        }

        const data = await response.json();
        
        if (data.token && data.user) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Fetch user data after authentication
          const userResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/api/users/me`,
            {
              headers: {
                'Authorization': `Bearer ${data.token}`
              }
            }
          );
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            localStorage.setItem('user', JSON.stringify(userData));
          }
          
          navigate('/profile');
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/login?error=' + encodeURIComponent(error.message));
      }
    };

    handleCallback();
  }, [navigate, location.search, provider]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500" />
      <p className="mt-4 text-gray-600">Completing authentication...</p>
    </div>
  );
};

export default AuthCallback;
