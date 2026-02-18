// app/(main)/drawer-layout.js
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import LoadingScreen from '../../src/components/LoadingScreen';
import { useAuth } from '../../src/contexts/AuthContext';
import { AuthService } from '../../src/services/authService';

export default function DrawerLayout() {
  const { user, userData, loading, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await AuthService.logout();
              if (result.success) {
                logout(); // Clear local auth state
                router.replace('/(auth)/login');
              } else {
                Alert.alert('Error', 'Failed to logout. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Show loading screen while user data is being fetched
  if (loading) {
    return <LoadingScreen />;
  }

  // If no user data, don't render drawer (should redirect to login via RoleGuard)
  if (!userData) {
    return null;
  }

  // Custom drawer content
  const CustomDrawerContent = ({ navigation }) => (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <View style={{
        backgroundColor: '#3498db',
        padding: 20,
        paddingTop: 40,
        alignItems: 'center'
      }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 10
        }}>
          <MaterialIcons name="person" size={40} color="white" />
        </View>
        <Text style={{
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: 5
        }}>
          {userData?.firstName && userData?.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : userData?.displayName || 'User'}
        </Text>
        <Text style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: 14
        }}>
          {userData?.role === 'employer' ? 'Employer' : 'Job Seeker'}
        </Text>
      </View>

      {/* Menu Items */}
      <View style={{ flex: 1, paddingTop: 20 }}>
        {/* Dashboard */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 15,
            backgroundColor: 'white',
            marginHorizontal: 10,
            marginBottom: 5,
            borderRadius: 8
          }}
          onPress={() => {
            navigation.closeDrawer();
            router.push(userData?.role === 'employer'
              ? '/(main)/employer/dashboard'
              : '/(main)/jobseeker/dashboard'
            );
          }}
        >
          <MaterialIcons name="dashboard" size={24} color="#3498db" />
          <Text style={{ marginLeft: 15, fontSize: 16, color: '#2c3e50' }}>
            Dashboard
          </Text>
        </TouchableOpacity>

        {/* Jobs */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 15,
            backgroundColor: 'white',
            marginHorizontal: 10,
            marginBottom: 5,
            borderRadius: 8
          }}
          onPress={() => {
            navigation.closeDrawer();
            router.push(userData?.role === 'employer'
              ? '/(main)/employer/jobs'
              : '/(main)/jobseeker/jobs'
            );
          }}
        >
          <MaterialIcons name="work" size={24} color="#2ecc71" />
          <Text style={{ marginLeft: 15, fontSize: 16, color: '#2c3e50' }}>
            {userData?.role === 'employer' ? 'My Jobs' : 'Find Jobs'}
          </Text>
        </TouchableOpacity>

        {/* Applications/Candidates */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 15,
            backgroundColor: 'white',
            marginHorizontal: 10,
            marginBottom: 5,
            borderRadius: 8
          }}
          onPress={() => {
            navigation.closeDrawer();
            router.push(userData?.role === 'employer'
              ? '/(main)/employer/candidates'
              : '/(main)/jobseeker/applications'
            );
          }}
        >
          <MaterialIcons
            name={userData?.role === 'employer' ? 'people' : 'description'}
            size={24}
            color="#9b59b6"
          />
          <Text style={{ marginLeft: 15, fontSize: 16, color: '#2c3e50' }}>
            {userData?.role === 'employer' ? 'Candidates' : 'Applications'}
          </Text>
        </TouchableOpacity>

        {/* Messages */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 15,
            backgroundColor: 'white',
            marginHorizontal: 10,
            marginBottom: 5,
            borderRadius: 8
          }}
          onPress={() => {
            navigation.closeDrawer();
            router.push(userData?.role === 'employer'
              ? '/(main)/employer/message'
              : '/(main)/jobseeker/message'
            );
          }}
        >
          <MaterialIcons name="chat" size={24} color="#e67e22" />
          <Text style={{ marginLeft: 15, fontSize: 16, color: '#2c3e50' }}>
            Messages
          </Text>
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 15,
            backgroundColor: 'white',
            marginHorizontal: 10,
            marginBottom: 5,
            borderRadius: 8
          }}
          onPress={() => {
            navigation.closeDrawer();
            router.push(userData?.role === 'employer'
              ? '/(main)/employer/profile'
              : '/(main)/jobseeker/profile'
            );
          }}
        >
          <MaterialIcons name="person" size={24} color="#3498db" />
          <Text style={{ marginLeft: 15, fontSize: 16, color: '#2c3e50' }}>
            {userData?.role === 'employer' ? 'Company Profile' : 'Profile'}
          </Text>
        </TouchableOpacity>

        {/* Post Job (Employer only) */}
        {userData?.role === 'employer' && (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 15,
              backgroundColor: 'white',
              marginHorizontal: 10,
              marginBottom: 5,
              borderRadius: 8
            }}
            onPress={() => {
              navigation.closeDrawer();
              router.push('/(main)/employer/post-job');
            }}
          >
            <Ionicons name="add-circle" size={24} color="#e74c3c" />
            <Text style={{ marginLeft: 15, fontSize: 16, color: '#2c3e50' }}>
              Post New Job
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 15,
          backgroundColor: '#e74c3c',
          marginHorizontal: 10,
          marginBottom: 20,
          borderRadius: 8
        }}
        onPress={handleLogout}
      >
        <MaterialIcons name="logout" size={24} color="white" />
        <Text style={{ marginLeft: 15, fontSize: 16, color: 'white', fontWeight: 'bold' }}>
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
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
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => {}}
            style={{
              marginLeft: 15,
              padding: 8,
            }}
          >
            <MaterialIcons name="menu" size={24} color="#ffffff" />
          </TouchableOpacity>
        ),
      }}
    >
      {/* Job Seeker Screens */}
      <Drawer.Screen
        name="jobseeker/dashboard"
        options={{
          title: 'Dashboard',
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="jobseeker/jobs"
        options={{
          title: 'Find Jobs',
          drawerLabel: 'Find Jobs',
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="work" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="jobseeker/applications"
        options={{
          title: 'My Applications',
          drawerLabel: 'My Applications',
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="description" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="jobseeker/profile"
        options={{
          title: 'Profile',
          drawerLabel: 'Profile',
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="jobseeker/edit-profile"
        options={{
          title: 'Edit Profile',
          drawerItemStyle: { display: 'none' },
        }}
      />

      {/* Employer Screens */}
      <Drawer.Screen
        name="employer/dashboard"
        options={{
          title: 'Dashboard',
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="employer/jobs"
        options={{
          title: 'My Jobs',
          drawerLabel: 'My Jobs',
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="work" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="employer/candidates"
        options={{
          title: 'Candidates',
          drawerLabel: 'Candidates',
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="people" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="employer/profile"
        options={{
          title: 'Company Profile',
          drawerLabel: 'Company Profile',
          drawerIcon: ({ color, size }) => (
            <FontAwesome5 name="building" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="employer/edit-profile"
        options={{
          title: 'Edit Company',
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="employer/post-job"
        options={{
          title: 'Post New Job',
          drawerLabel: 'Post New Job',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />

      {/* Shared Screens */}
      <Drawer.Screen
        name="messages"
        options={{
          title: 'Messages',
          drawerLabel: 'Messages',
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="chat" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="index"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}
