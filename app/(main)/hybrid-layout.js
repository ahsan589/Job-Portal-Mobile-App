// app/(main)/hybrid-layout.js
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import LoadingScreen from '../../src/components/LoadingScreen';
import { useAuth } from '../../src/contexts/AuthContext';
import { AuthService } from '../../src/services/authService';

export default function HybridLayout() {
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

  // Show loading screen while auth/user data is being resolved to prevent blank flashes
  if (loading || !userData) {
    return <LoadingScreen />;
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
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 10
        }}>
          <MaterialIcons name="person" size={30} color="white" />
        </View>
        <Text style={{
          color: 'white',
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: 5,
          textAlign: 'center'
        }}>
          {userData?.firstName && userData?.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : userData?.displayName || 'User'}
        </Text>
        <Text style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: 12
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
            padding: 12,
            backgroundColor: 'white',
            marginHorizontal: 10,
            marginBottom: 5,
            borderRadius: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2
          }}
          onPress={() => {
            navigation.closeDrawer();
            router.push(userData?.role === 'employer'
              ? '/(main)/employer/dashboard'
              : '/(main)/jobseeker/dashboard'
            );
          }}
        >
          <MaterialIcons name="dashboard" size={20} color="#3498db" />
          <Text style={{ marginLeft: 12, fontSize: 14, color: '#2c3e50' }}>
            Dashboard
          </Text>
        </TouchableOpacity>

        {/* Jobs */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            backgroundColor: 'white',
            marginHorizontal: 10,
            marginBottom: 5,
            borderRadius: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2
          }}
          onPress={() => {
            navigation.closeDrawer();
            router.push(userData?.role === 'employer'
              ? '/(main)/employer/jobs'
              : '/(main)/jobseeker/jobs'
            );
          }}
        >
          <MaterialIcons name="work" size={20} color="#2ecc71" />
          <Text style={{ marginLeft: 12, fontSize: 14, color: '#2c3e50' }}>
            {userData?.role === 'employer' ? 'My Jobs' : 'Find Jobs'}
          </Text>
        </TouchableOpacity>

        {/* Applications/Candidates */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            backgroundColor: 'white',
            marginHorizontal: 10,
            marginBottom: 5,
            borderRadius: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2
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
            size={20}
            color="#9b59b6"
          />
          <Text style={{ marginLeft: 12, fontSize: 14, color: '#2c3e50' }}>
            {userData?.role === 'employer' ? 'Candidates' : 'Applications'}
          </Text>
        </TouchableOpacity>



        {/* Community Posts */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            backgroundColor: 'white',
            marginHorizontal: 10,
            marginBottom: 5,
            borderRadius: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2
          }}
          onPress={() => {
            navigation.closeDrawer();
            router.push('/(main)/posts');
          }}
        >
          <MaterialIcons name="article" size={20} color="#2980b9" />
          <Text style={{ marginLeft: 12, fontSize: 14, color: '#2c3e50' }}>
            Community Posts
          </Text>
        </TouchableOpacity>







        {/* Analytics (Employer only) */}
        {userData?.role === 'employer' && (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              backgroundColor: 'white',
              marginHorizontal: 10,
              marginBottom: 5,
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}
            onPress={() => {
              navigation.closeDrawer();
              router.push('/(main)/analytics');
            }}
          >
            <MaterialIcons name="analytics" size={20} color="#e74c3c" />
            <Text style={{ marginLeft: 12, fontSize: 14, color: '#2c3e50' }}>
              Analytics
            </Text>
          </TouchableOpacity>
        )}

        {/* Profile */}
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            backgroundColor: 'white',
            marginHorizontal: 10,
            marginBottom: 5,
            borderRadius: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2
          }}
          onPress={() => {
            navigation.closeDrawer();
            router.push(userData?.role === 'employer'
              ? '/(main)/employer/profile'
              : '/(main)/jobseeker/profile'
            );
          }}
        >
          <MaterialIcons name="person" size={20} color="#3498db" />
          <Text style={{ marginLeft: 12, fontSize: 14, color: '#2c3e50' }}>
            {userData?.role === 'employer' ? 'Company Profile' : 'Profile'}
          </Text>
        </TouchableOpacity>

        {/* Post Job (Employer only) */}
        {userData?.role === 'employer' && (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 12,
              backgroundColor: 'white',
              marginHorizontal: 10,
              marginBottom: 5,
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }}
            onPress={() => {
              navigation.closeDrawer();
              router.push('/(main)/employer/post-job');
            }}
          >
            <Ionicons name="add-circle" size={20} color="#e74c3c" />
            <Text style={{ marginLeft: 12, fontSize: 14, color: '#2c3e50' }}>
              Post New Job
            </Text>
          </TouchableOpacity>
        )}

        {/* Spacer to push logout to bottom */}
        <View style={{ flex: 1 }} />
      </View>

      {/* Logout - Fixed at bottom */}
      <View style={{
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        backgroundColor: 'white',
        paddingBottom: 20
      }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 15,
            backgroundColor: '#e74c3c',
            marginHorizontal: 10,
            marginTop: 10,
            borderRadius: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={20} color="white" />
          <Text style={{ marginLeft: 12, fontSize: 14, color: 'white', fontWeight: 'bold' }}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Drawer
      detachInactiveScreens={false}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />

      {/* Hidden screens for navigation */}
      <Drawer.Screen
        name="jobseeker/edit-profile"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="employer/edit-profile"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="employer/post-job"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="employer/edit-job"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="messages"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="index"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="posts"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="notifications"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="subscription"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="help-support"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="analytics"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="jobseeker/job-details"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
    </Drawer>
  );
}
