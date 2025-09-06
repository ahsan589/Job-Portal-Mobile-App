import { Stack } from 'expo-router';
import React, { useState } from 'react';
import LoadingScreen from '../src/components/LoadingScreen';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import SplashScreen from './components/SplashScreen';

// Create a component that uses the auth context
function LayoutContent() {
  const { loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashEnd = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onAnimationEnd={handleSplashEnd} />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(main)" />
    </Stack>
  );
}

// Main layout component that provides the auth context
export default function Layout() {
  return (
    <AuthProvider>
      <LayoutContent />
    </AuthProvider>
  );
}
