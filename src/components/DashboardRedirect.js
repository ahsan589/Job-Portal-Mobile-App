import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

const DashboardRedirect = () => {
  const { userData, loading } = useAuth();

  if (loading) return null; // optionally add a loading spinner

  if (!userData) {
    // If not logged in, redirect to login
    return <Redirect href="/(auth)/login" />;
  }

  if (userData.role === 'jobseeker') {
    return <Redirect href="/(main)/jobseeker/dashboard" />;
  } else if (userData.role === 'employer') {
    return <Redirect href="/(main)/employer/dashboard" />;
  }

  // fallback if role is undefined
  return <Redirect href="/(auth)/login" />;
};

export default DashboardRedirect;
