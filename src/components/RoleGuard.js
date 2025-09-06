import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const RoleGuard = ({ requiredRole, children }) => {
  const { userData, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3498db" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!userData) {
    // If not logged in, redirect to login
    return <Redirect href="/(auth)/login" />;
  }

  if (userData.role !== requiredRole) {
    // If user doesn't have the required role, redirect to their dashboard
    if (userData.role === 'jobseeker') {
      return <Redirect href="/(main)/jobseeker/dashboard" />;
    } else if (userData.role === 'employer') {
      return <Redirect href="/(main)/employer/dashboard" />;
    } else {
      // Fallback for undefined role
      return <Redirect href="/(auth)/login" />;
    }
  }

  // User has the correct role, render the children
  return children;
};

export default RoleGuard;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    marginTop: 8,
    color: '#7f8c8d'
  }
});
