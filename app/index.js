import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
  const { user } = useAuth();

  // Redirect to the appropriate screen based on authentication status
  if (user) {
    return <Redirect href="/(main)" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
}