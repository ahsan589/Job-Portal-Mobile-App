// app/(main)/employer/profile.js
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import RoleGuard from '../../../src/components/RoleGuard';
import { useAuth } from '../../../src/contexts/AuthContext';
import { ProfileService } from '../../../src/services/profileService';

const EmployerProfileScreen = () => {
  const { user, userData } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (user) {
      const result = await ProfileService.getProfile(user.uid);
      if (result.success) {
        setProfile(result.data);
      } else {
        Alert.alert('Error', result.error);
      }
    }
    setLoading(false);
  };

  const handleEditProfile = () => {
    router.push('/(main)/employer/edit-profile');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <RoleGuard requiredRole="employer">
      <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <Image
            source={
              profile?.companyLogo
                ? profile.companyLogo.startsWith('data:')
                  ? { uri: profile.companyLogo }
                  : { uri: profile.companyLogo }
                : require('../../../assets/images/logo.png')
            }
            style={styles.companyLogo}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.companyName}>
              {profile?.companyName || 'Your Company Name'}
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
            {profile?.industry && <Text style={styles.industry}>{profile.industry}</Text>}
          </View>
        </View>
        
        <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
          <MaterialIcons name="edit" size={20} color="#3498db" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Company Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company Information</Text>
        
        {profile?.companyDescription && (
          <Text style={styles.companyDescription}>{profile.companyDescription}</Text>
        )}

        <View style={styles.detailsGrid}>
          {profile?.companySize && (
            <View style={styles.detailItem}>
              <MaterialIcons name="people" size={20} color="#3498db" />
              <Text style={styles.detailLabel}>Size</Text>
              <Text style={styles.detailValue}>{profile.companySize}</Text>
            </View>
          )}
          
          {profile?.foundedYear && (
            <View style={styles.detailItem}>
              <MaterialIcons name="calendar-today" size={20} color="#3498db" />
              <Text style={styles.detailLabel}>Founded</Text>
              <Text style={styles.detailValue}>{profile.foundedYear}</Text>
            </View>
          )}
          
          {profile?.website && (
            <View style={styles.detailItem}>
              <MaterialIcons name="language" size={20} color="#3498db" />
              <Text style={styles.detailLabel}>Website</Text>
              <TouchableOpacity onPress={() => Linking.openURL(profile.website)}>
                <Text style={[styles.detailValue, styles.link]}>Visit Website</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        
        <View style={styles.contactInfo}>
          {profile?.contactPerson && (
            <View style={styles.contactItem}>
              <MaterialIcons name="person" size={20} color="#3498db" />
              <Text style={styles.contactText}>{profile.contactPerson}</Text>
            </View>
          )}
          
          {profile?.phone && (
            <View style={styles.contactItem}>
              <MaterialIcons name="phone" size={20} color="#3498db" />
              <Text style={styles.contactText}>{profile.phone}</Text>
            </View>
          )}
          
          {profile?.address && (
            <View style={styles.contactItem}>
              <MaterialIcons name="location-on" size={20} color="#3498db" />
              <Text style={styles.contactText}>{profile.address}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Social Media */}
      {(profile?.linkedIn || profile?.twitter || profile?.facebook) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media</Text>
          <View style={styles.socialLinks}>
            {profile.linkedIn && (
              <TouchableOpacity 
                onPress={() => Linking.openURL(profile.linkedIn)}
                style={styles.socialButton}
              >
                <FontAwesome5 name="linkedin" size={20} color="#0077b5" />
                <Text style={styles.socialText}>LinkedIn</Text>
              </TouchableOpacity>
            )}
            
            {profile.twitter && (
              <TouchableOpacity 
                onPress={() => Linking.openURL(profile.twitter)}
                style={styles.socialButton}
              >
                <FontAwesome5 name="twitter" size={20} color="#1da1f2" />
                <Text style={styles.socialText}>Twitter</Text>
              </TouchableOpacity>
            )}
            
            {profile.facebook && (
              <TouchableOpacity 
                onPress={() => Linking.openURL(profile.facebook)}
                style={styles.socialButton}
              >
                <FontAwesome5 name="facebook" size={20} color="#1877f2" />
                <Text style={styles.socialText}>Facebook</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Company Culture */}
      {profile?.companyCulture && profile.companyCulture.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Culture</Text>
          <View style={styles.cultureContainer}>
            {profile.companyCulture.map((culture, index) => (
              <View key={index} style={styles.cultureTag}>
                <Text style={styles.cultureText}>{culture}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
    </RoleGuard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  companyLogo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  industry: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  editButtonText: {
    color: '#3498db',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  companyDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#34495e',
    marginBottom: 15,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  detailItem: {
    minWidth: 100,
  },
  detailLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  link: {
    color: '#3498db',
  },
  contactInfo: {
    gap: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    marginLeft: 10,
    color: '#34495e',
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 15,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  socialText: {
    marginLeft: 5,
    color: '#2c3e50',
    fontWeight: '500',
  },
  cultureContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cultureTag: {
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  cultureText: {
    color: '#3498db',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default EmployerProfileScreen;