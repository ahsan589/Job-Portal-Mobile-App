// app/(main)/jobseeker/profile.js
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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

const JobSeekerProfileScreen = () => {
  const { user, userData } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  useFocusEffect(() => {
    loadProfile();
    return () => {}; // cleanup function
  });

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
    router.push('/(main)/jobseeker/edit-profile');
  };

  const handleViewResume = async () => {
    if (profile?.resumeUrl) {
      try {
        await Linking.openURL(profile.resumeUrl);
      } catch (error) {
        Alert.alert('Error', 'Could not open resume');
      }
    }
  };

  if (loading) {
    return (
      <RoleGuard requiredRole="jobseeker">
        <View style={styles.loadingContainer}>
          <Text>Loading profile...</Text>
        </View>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="jobseeker">
      <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <Image
            source={
              profile?.profileImage
                ? profile.profileImage.startsWith('data:')
                  ? { uri: profile.profileImage }
                  : { uri: profile.profileImage }
                : require('../../../assets/images/logo.png')
            }
            style={styles.profileImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              {profile?.firstName && profile?.lastName 
                ? `${profile.firstName} ${profile.lastName}`
                : 'Complete Your Profile'
              }
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
            {profile?.title && <Text style={styles.title}>{profile.title}</Text>}
          </View>
        </View>
        
        <TouchableOpacity onPress={handleEditProfile} style={styles.editButton}>
          <MaterialIcons name="edit" size={20} color="#3498db" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Resume Section */}
      {profile?.resumeUrl && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resume</Text>
          <TouchableOpacity onPress={handleViewResume} style={styles.resumeButton}>
            <FontAwesome5 name="file-pdf" size={20} color="#e74c3c" />
            <Text style={styles.resumeText}>View Resume</Text>
            <MaterialIcons name="open-in-new" size={16} color="#3498db" />
          </TouchableOpacity>
        </View>
      )}

      {/* About Section */}
      {profile?.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.bio}>{profile.bio}</Text>
        </View>
      )}

      {/* Skills Section */}
      {profile?.skills && profile.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {profile.skills.map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Education Section */}
      {profile?.education && profile.education.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {profile.education.map((edu, index) => (
            <View key={index} style={styles.educationItem}>
              <Text style={styles.educationDegree}>{edu.degree}</Text>
              <Text style={styles.educationSchool}>{edu.school}</Text>
              <Text style={styles.educationPeriod}>
                {edu.startYear} - {edu.currentlyStudying ? 'Present' : (edu.endYear || 'Present')}
              </Text>
              {(edu.cgpa || edu.percentage) && (
                <Text style={styles.educationGrades}>
                  {edu.cgpa && `CGPA: ${edu.cgpa}`}
                  {edu.cgpa && edu.percentage && ' | '}
                  {edu.percentage && `Percentage: ${edu.percentage}`}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Experience Section */}
      {profile?.experience && profile.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {profile.experience.map((exp, index) => (
            <View key={index} style={styles.experienceItem}>
              <Text style={styles.experiencePosition}>{exp.position}</Text>
              <Text style={styles.experienceCompany}>{exp.company}</Text>
              <Text style={styles.experiencePeriod}>
                {exp.startDate} - {exp.currentlyWorking ? 'Present' : (exp.endDate || 'Present')}
              </Text>
              {exp.description && (
                <Text style={styles.experienceDescription}>{exp.description}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Projects Section */}
      {profile?.projects && profile.projects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projects</Text>
          {profile.projects.map((project, index) => (
            <View key={index} style={styles.projectItem}>
              <Text style={styles.projectName}>{project.name}</Text>
              {project.description && (
                <Text style={styles.projectDescription}>{project.description}</Text>
              )}
              {project.technologies && (
                <Text style={styles.projectTech}>Technologies: {project.technologies}</Text>
              )}
              <View style={styles.projectLinks}>
                {project.githubUrl && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(project.githubUrl)}
                    style={styles.projectLink}
                  >
                    <FontAwesome5 name="github" size={16} color="#333" />
                    <Text style={styles.projectLinkText}>GitHub</Text>
                  </TouchableOpacity>
                )}
                {project.liveUrl && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(project.liveUrl)}
                    style={styles.projectLink}
                  >
                    <MaterialIcons name="link" size={16} color="#3498db" />
                    <Text style={styles.projectLinkText}>Live Demo</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.projectPeriod}>
                {project.startDate} - {project.currentlyWorking ? 'Present' : (project.endDate || 'Present')}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Job Preferences */}
      {profile?.jobPreferences && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Preferences</Text>
          <View style={styles.preferencesContainer}>
            <View style={styles.preferenceGroup}>
              <Text style={styles.preferenceGroupTitle}>Employment Type:</Text>
              <View style={styles.preferenceTags}>
                {profile.jobPreferences.fullTime && (
                  <View style={styles.preferenceTag}>
                    <Text style={styles.preferenceTagText}>Full Time</Text>
                  </View>
                )}
                {profile.jobPreferences.partTime && (
                  <View style={styles.preferenceTag}>
                    <Text style={styles.preferenceTagText}>Part Time</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.preferenceGroup}>
              <Text style={styles.preferenceGroupTitle}>Work Arrangement:</Text>
              <View style={styles.preferenceTags}>
                {profile.jobPreferences.remote && (
                  <View style={styles.preferenceTag}>
                    <Text style={styles.preferenceTagText}>Remote</Text>
                  </View>
                )}
                {profile.jobPreferences.onSite && (
                  <View style={styles.preferenceTag}>
                    <Text style={styles.preferenceTagText}>On-site</Text>
                  </View>
                )}
                {profile.jobPreferences.hybrid && (
                  <View style={styles.preferenceTag}>
                    <Text style={styles.preferenceTagText}>Hybrid</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.contactInfo}>
          {profile?.phone && (
            <View style={styles.contactItem}>
              <MaterialIcons name="phone" size={20} color="#3498db" />
              <Text style={styles.contactText}>{profile.phone}</Text>
            </View>
          )}
          {profile?.location && (
            <View style={styles.contactItem}>
              <MaterialIcons name="location-on" size={20} color="#3498db" />
              <Text style={styles.contactText}>{profile.location}</Text>
            </View>
          )}
          {profile?.linkedIn && (
            <View style={styles.contactItem}>
              <FontAwesome5 name="linkedin" size={20} color="#0077b5" />
              <Text style={styles.contactText}>{profile.linkedIn}</Text>
            </View>
          )}
          {profile?.github && (
            <View style={styles.contactItem}>
              <FontAwesome5 name="github" size={20} color="#333" />
              <Text style={styles.contactText}>{profile.github}</Text>
            </View>
          )}
        </View>
      </View>
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
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
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
  title: {
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
  bio: {
    fontSize: 14,
    lineHeight: 20,
    color: '#34495e',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  skillText: {
    color: '#3498db',
    fontSize: 12,
    fontWeight: '500',
  },
  educationItem: {
    marginBottom: 15,
  },
  educationDegree: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  educationSchool: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  educationPeriod: {
    fontSize: 12,
    color: '#95a5a6',
  },
  educationGrades: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '500',
    marginTop: 2,
  },
  experienceItem: {
    marginBottom: 15,
  },
  experiencePosition: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  experienceCompany: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  experiencePeriod: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 4,
  },
  experienceDescription: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  resumeText: {
    flex: 1,
    marginLeft: 10,
    color: '#2c3e50',
    fontWeight: '500',
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
  projectItem: {
    marginBottom: 15,
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  projectDescription: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
    marginTop: 4,
  },
  projectTech: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  projectLinks: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 15,
  },
  projectLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectLinkText: {
    fontSize: 12,
    color: '#3498db',
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
  projectPeriod: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 4,
  },
  preferencesContainer: {
    gap: 15,
  },
  preferenceGroup: {
    marginBottom: 10,
  },
  preferenceGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  preferenceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceTag: {
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  preferenceTagText: {
    color: '#3498db',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default JobSeekerProfileScreen;