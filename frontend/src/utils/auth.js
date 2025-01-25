export const handleGoogleLogin = () => {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
};

export const handleGithubLogin = () => {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/github`;
};

export const handleSocialAuthCallback = async (provider, code) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/${provider}/callback?code=${code}`);
    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Auth error:', error);
    return false;
  }
};
