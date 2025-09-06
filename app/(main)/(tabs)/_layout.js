import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import LoadingScreen from '../../../src/components/LoadingScreen';
import { useAuth } from '../../../src/contexts/AuthContext';

export default function TabsLayout() {
  const { userData } = useAuth();

  // Define bottom tab screens based on user role
  const getTabScreens = () => {
    if (userData?.role === 'jobseeker') {
      return [
        <Tabs.Screen
          key="dashboard"
          name="../jobseeker/dashboard"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
          }}
        />,
        <Tabs.Screen
          key="jobs"
          name="../jobseeker/jobs"
          options={{
            title: 'Jobs',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="work" size={size} color={color} />
            ),
          }}
        />,
        <Tabs.Screen
          key="applications"
          name="../jobseeker/applications"
          options={{
            title: 'Applications',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="description" size={size} color={color} />
            ),
          }}
        />,
        <Tabs.Screen
          key="messages"
          name="../messages"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="chat" size={size} color={color} />
            ),
          }}
        />,
        <Tabs.Screen
          key="profile"
          name="../jobseeker/profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="person" size={size} color={color} />
            ),
          }}
        />,
      ];
    } else if (userData?.role === 'employer') {
      return [
        <Tabs.Screen
          key="dashboard"
          name="../employer/dashboard"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
          }}
        />,
        <Tabs.Screen
          key="jobs"
          name="../employer/jobs"
          options={{
            title: 'Jobs',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="work" size={size} color={color} />
            ),
          }}
        />,
        <Tabs.Screen
          key="candidates"
          name="../employer/candidates"
          options={{
            title: 'Candidates',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="people" size={size} color={color} />
            ),
          }}
        />,
        <Tabs.Screen
          key="messages"
          name="../messages"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="chat" size={size} color={color} />
            ),
          }}
        />,
        <Tabs.Screen
          key="profile"
          name="../employer/profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="building" size={size} color={color} />
            ),
          }}
        />,
      ];
    }
    return [];
  };

  if (!userData) {
    return <LoadingScreen />;
  }

  return (
    <Tabs
      detachInactiveScreens={false}
      sceneContainerStyle={{ backgroundColor: '#ffffff' }}
      screenOptions={{
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#7f8c8d',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#ecf0f1',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#3498db',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      {getTabScreens()}
    </Tabs>
  );
}
