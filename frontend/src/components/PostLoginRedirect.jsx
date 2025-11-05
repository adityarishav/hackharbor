import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext'; // Adjust path as needed

const PostLoginRedirect = () => {
  const { user, isLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Wait until the user data is loaded and available
    if (!isLoading && user) {
      // Check the user's role and navigate accordingly
      if (user.role === 'admin') {
        navigate('/admin'); // Or your specific admin route
      } else {
        navigate('/dashboard'); // The route for normal users
      }
    }
  }, [user, isLoading, navigate]); // Rerun effect if these values change

  // Display a loading indicator while the redirect is happening
  return (
    <div className="flex h-screen items-center justify-center">
      <p>Loading your dashboard...</p>
    </div>
  );
};

export default PostLoginRedirect;