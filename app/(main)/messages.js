import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import LoadingScreen from '../../src/components/LoadingScreen';
import { useAuth } from '../../src/contexts/AuthContext';

const MessagesScreen = () => {
  const { userData, loading } = useAuth();
  const params = useLocalSearchParams();

  useEffect(() => {
    if (!loading && userData) {
      // Redirect to role-specific message screen with params
      const targetPath = userData.role === 'employer'
        ? '/employer/message'
        : '/jobseeker/message';

      router.replace({
        pathname: targetPath,
        params: params
      });
    }
  }, [userData, loading, params]);

  if (loading) {
    return <LoadingScreen />;
  }

  return null; // This component will redirect immediately
};

export default MessagesScreen;
