import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import ImagePickerComponent from '../../../src/components/ImagePicker';
import IndustrySelector from '../../../src/components/IndustrySelector';
import RoleGuard from '../../../src/components/RoleGuard';
import SkillsSelector from '../../../src/components/SkillsSelector';
import { useAuth } from '../../../src/contexts/AuthContext';
import { ProfileService } from '../../../src/services/profileService';
import { UploadService } from '../../../src/utils/uploadService';

const JobSeekerEditProfileScreen = () => {
  const { user } = useAuth();
  const uid = user?.uid;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    title: '',
    bio: '',
    phone: '',
    location: '',
    linkedIn: '',
    github: '',
    education: [],
    experience: [],
    projects: [],
    skills: [],
    industry: '',
    resumeUrl: '',
    jobPreferences: {
      partTime: false,
      fullTime: true,
      remote: false,
      onSite: true,
      hybrid: false
    }
  });

  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    if (uid) {
      loadProfile();
    }
  }, [uid]);

  const loadProfile = async () => {
    const result = await ProfileService.getProfile(uid);
    if (result.success) {
      setProfile(prev => ({
        ...prev,
        ...result.data,
        skills: result.data.skills || [],
        education: result.data.education || [],
        experience: result.data.experience || [],
        projects: result.data.projects || [],
        jobPreferences: result.data.jobPreferences || {
          partTime: false,
          fullTime: true,
          remote: false,
          onSite: true,
          hybrid: false
        }
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleJobPreferenceChange = (preference, value) => {
    setProfile(prev => ({
      ...prev,
      jobPreferences: {
        ...prev.jobPreferences,
        [preference]: value
      }
    }));
  };

  // Education handlers
  const addEducation = () => {
    setProfile(prev => ({
      ...prev,
      education: [...prev.education, {
        degree: '',
        school: '',
        startYear: '',
        endYear: '',
        cgpa: '',
        percentage: '',
        currentlyStudying: false
      }]
    }));
  };

  const updateEducation = (index, field, value) => {
    const updated = [...profile.education];
    updated[index] = { ...updated[index], [field]: value };
    setProfile(prev => ({ ...prev, education: updated }));
  };

  const removeEducation = (index) => {
    const updated = [...profile.education];
    updated.splice(index, 1);
    setProfile(prev => ({ ...prev, education: updated }));
  };

  // Experience handlers
  const addExperience = () => {
    setProfile(prev => ({
      ...prev,
      experience: [...prev.experience, {
        position: '',
        company: '',
        startDate: '',
        endDate: '',
        currentlyWorking: false,
        description: ''
      }]
    }));
  };

  const updateExperience = (index, field, value) => {
    const updated = [...profile.experience];
    updated[index] = { ...updated[index], [field]: value };
    setProfile(prev => ({ ...prev, experience: updated }));
  };

  const removeExperience = (index) => {
    const updated = [...profile.experience];
    updated.splice(index, 1);
    setProfile(prev => ({ ...prev, experience: updated }));
  };

  // Projects handlers
  const addProject = () => {
    setProfile(prev => ({
      ...prev,
      projects: [...prev.projects, {
        name: '',
        description: '',
        technologies: '',
        githubUrl: '',
        liveUrl: '',
        startDate: '',
        endDate: '',
        currentlyWorking: false
      }]
    }));
  };

  const updateProject = (index, field, value) => {
    const updated = [...profile.projects];
    updated[index] = { ...updated[index], [field]: value };
    setProfile(prev => ({ ...prev, projects: updated }));
  };

  const removeProject = (index) => {
    const updated = [...profile.projects];
    updated.splice(index, 1);
    setProfile(prev => ({ ...prev, projects: updated }));
  };

  const handleImageSelected = async (imageUri) => {
    if (!uid) return;
    setUploading(true);
    const result = await ProfileService.uploadProfileImage(uid, imageUri);
    setUploading(false);

    if (result.success) {
      setProfile(prev => ({ ...prev, profileImage: result.url }));
      Alert.alert('Success', 'Profile image updated successfully');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handlePickResume = async () => {
    const result = await UploadService.pickDocument();
    if (result.success) {
      setResumeFile({
        uri: result.uri,
        name: result.name || 'resume.pdf',
        type: result.mimeType || 'application/pdf',
        size: result.size,
      });
    }
  };

  const handleUploadResume = async () => {
    if (!resumeFile || !uid) return;

    setUploading(true);
    const result = await ProfileService.uploadResume(
      uid,
      resumeFile.uri,
      resumeFile.name,
      resumeFile.type
    );
    setUploading(false);

    if (result.success) {
      setProfile(prev => ({ ...prev, resumeUrl: result.url }));
      setResumeFile(null);
      Alert.alert('Success', 'Resume uploaded successfully');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleSaveProfile = async () => {
    if (!uid) return;
    setLoading(true);
    const result = await ProfileService.updateJobSeekerProfile(uid, profile);
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', result.message);
      router.back();
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <RoleGuard requiredRole="jobseeker">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Edit Profile</Text>

          {/* Profile Image */}
          <ImagePickerComponent
            onImageSelected={handleImageSelected}
            currentImage={profile.profileImage}
          />

          {/* Personal Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={profile.firstName}
                  onChangeText={(text) => handleInputChange('firstName', text)}
                  placeholder="Enter first name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={profile.lastName}
                  onChangeText={(text) => handleInputChange('lastName', text)}
                  placeholder="Enter last name"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Professional Title</Text>
              <TextInput
                style={styles.input}
                value={profile.title}
                onChangeText={(text) => handleInputChange('title', text)}
                placeholder="e.g., Software Developer"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio / About</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={profile.bio}
                onChangeText={(text) => handleInputChange('bio', text)}
                placeholder="Tell us about yourself..."
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                value={profile.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                placeholder="Enter phone number"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={profile.location}
                onChangeText={(text) => handleInputChange('location', text)}
                placeholder="Enter location"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>LinkedIn</Text>
              <TextInput
                style={styles.input}
                value={profile.linkedIn}
                onChangeText={(text) => handleInputChange('linkedIn', text)}
                placeholder="Enter LinkedIn URL"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>GitHub</Text>
              <TextInput
                style={styles.input}
                value={profile.github}
                onChangeText={(text) => handleInputChange('github', text)}
                placeholder="Enter GitHub URL"
              />
            </View>
          </View>

          {/* Education Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {profile.education.map((edu, index) => (
              <View key={index} style={styles.educationItem}>
                <View style={styles.row}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Degree</Text>
                    <TextInput
                      style={styles.input}
                      value={edu.degree}
                      onChangeText={(text) => updateEducation(index, 'degree', text)}
                      placeholder="e.g., BSc Computer Science"
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => removeEducation(index)}
                    style={styles.removeButton}
                  >
                    <MaterialIcons name="delete" size={24} color="red" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  value={edu.school}
                  onChangeText={(text) => updateEducation(index, 'school', text)}
                  placeholder="School/University"
                />

                <View style={styles.row}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Start Year</Text>
                    <TextInput
                      style={styles.input}
                      value={edu.startYear}
                      onChangeText={(text) => updateEducation(index, 'startYear', text)}
                      placeholder="2020"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>End Year</Text>
                    <TextInput
                      style={styles.input}
                      value={edu.endYear}
                      onChangeText={(text) => updateEducation(index, 'endYear', text)}
                      placeholder="2024"
                      keyboardType="numeric"
                      editable={!edu.currentlyStudying}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>CGPA</Text>
                    <TextInput
                      style={styles.input}
                      value={edu.cgpa}
                      onChangeText={(text) => updateEducation(index, 'cgpa', text)}
                      placeholder="8.5"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Percentage</Text>
                    <TextInput
                      style={styles.input}
                      value={edu.percentage}
                      onChangeText={(text) => updateEducation(index, 'percentage', text)}
                      placeholder="85%"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View style={styles.switchContainer}>
                  <Text style={styles.label}>Currently Studying</Text>
                  <Switch
                    value={edu.currentlyStudying}
                    onValueChange={(value) => updateEducation(index, 'currentlyStudying', value)}
                  />
                </View>
              </View>
            ))}
            <TouchableOpacity onPress={addEducation} style={styles.addButton}>
              <MaterialIcons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Add Education</Text>
            </TouchableOpacity>
          </View>

          {/* Experience Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {profile.experience.map((exp, index) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.row}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Position</Text>
                    <TextInput
                      style={styles.input}
                      value={exp.position}
                      onChangeText={(text) => updateExperience(index, 'position', text)}
                      placeholder="Job Title"
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => removeExperience(index)}
                    style={styles.removeButton}
                  >
                    <MaterialIcons name="delete" size={24} color="red" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  value={exp.company}
                  onChangeText={(text) => updateExperience(index, 'company', text)}
                  placeholder="Company Name"
                />

                <View style={styles.row}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Start Date</Text>
                    <TextInput
                      style={styles.input}
                      value={exp.startDate}
                      onChangeText={(text) => updateExperience(index, 'startDate', text)}
                      placeholder="MM/YYYY"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>End Date</Text>
                    <TextInput
                      style={styles.input}
                      value={exp.endDate}
                      onChangeText={(text) => updateExperience(index, 'endDate', text)}
                      placeholder="MM/YYYY"
                      editable={!exp.currentlyWorking}
                    />
                  </View>
                </View>

                <View style={styles.switchContainer}>
                  <Text style={styles.label}>Currently Working</Text>
                  <Switch
                    value={exp.currentlyWorking}
                    onValueChange={(value) => updateExperience(index, 'currentlyWorking', value)}
                  />
                </View>

                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={exp.description}
                  onChangeText={(text) => updateExperience(index, 'description', text)}
                  placeholder="Job description and achievements..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            ))}
            <TouchableOpacity onPress={addExperience} style={styles.addButton}>
              <MaterialIcons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Add Experience</Text>
            </TouchableOpacity>
          </View>

          {/* Projects Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {profile.projects.map((project, index) => (
              <View key={index} style={styles.projectItem}>
                <View style={styles.row}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Project Name</Text>
                    <TextInput
                      style={styles.input}
                      value={project.name}
                      onChangeText={(text) => updateProject(index, 'name', text)}
                      placeholder="Project Name"
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => removeProject(index)}
                    style={styles.removeButton}
                  >
                    <MaterialIcons name="delete" size={24} color="red" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={project.description}
                  onChangeText={(text) => updateProject(index, 'description', text)}
                  placeholder="Project description..."
                  multiline
                  numberOfLines={3}
                />

                <TextInput
                  style={styles.input}
                  value={project.technologies}
                  onChangeText={(text) => updateProject(index, 'technologies', text)}
                  placeholder="Technologies used (comma separated)"
                />

                <View style={styles.row}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>GitHub URL</Text>
                <TextInput
                  style={styles.input}
                  value={project.githubUrl}
                  onChangeText={(text) => updateProject(index, 'githubUrl', text)}
                  placeholder="https://github.com/..."
                />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Live URL</Text>
                    <TextInput
                      style={styles.input}
                      value={project.liveUrl}
                      onChangeText={(text) => updateProject(index, 'liveUrl', text)}
                      placeholder="https://..."
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Start Date</Text>
                    <TextInput
                      style={styles.input}
                      value={project.startDate}
                      onChangeText={(text) => updateProject(index, 'startDate', text)}
                      placeholder="MM/YYYY"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>End Date</Text>
                    <TextInput
                      style={styles.input}
                      value={project.endDate}
                      onChangeText={(text) => updateProject(index, 'endDate', text)}
                      placeholder="MM/YYYY"
                      editable={!project.currentlyWorking}
                    />
                  </View>
                </View>

                <View style={styles.switchContainer}>
                  <Text style={styles.label}>Currently Working</Text>
                  <Switch
                    value={project.currentlyWorking}
                    onValueChange={(value) => updateProject(index, 'currentlyWorking', value)}
                  />
                </View>
              </View>
            ))}
            <TouchableOpacity onPress={addProject} style={styles.addButton}>
              <MaterialIcons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Add Project</Text>
            </TouchableOpacity>
          </View>

          {/* Skills */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
          <SkillsSelector
            skills={profile.skills}
            onSkillsChange={(skills) => setProfile(prev => ({ ...prev, skills }))}
          />
          </View>

          {/* Industry */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Industry</Text>
          <IndustrySelector
            selectedIndustry={profile.industry}
            onIndustryChange={(industry) => setProfile(prev => ({ ...prev, industry }))}
          />
          </View>

          {/* Job Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Preferences</Text>

            <View style={styles.preferenceContainer}>
              <Text style={styles.label}>Employment Type</Text>
              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceLabel}>Full Time</Text>
                <Switch
                  value={profile.jobPreferences.fullTime}
                  onValueChange={(value) => handleJobPreferenceChange('fullTime', value)}
                />
              </View>
              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceLabel}>Part Time</Text>
                <Switch
                  value={profile.jobPreferences.partTime}
                  onValueChange={(value) => handleJobPreferenceChange('partTime', value)}
                />
              </View>
            </View>

            <View style={styles.preferenceContainer}>
              <Text style={styles.label}>Work Arrangement</Text>
              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceLabel}>Remote</Text>
                <Switch
                  value={profile.jobPreferences.remote}
                  onValueChange={(value) => handleJobPreferenceChange('remote', value)}
                />
              </View>
              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceLabel}>On-site</Text>
                <Switch
                  value={profile.jobPreferences.onSite}
                  onValueChange={(value) => handleJobPreferenceChange('onSite', value)}
                />
              </View>
              <View style={styles.preferenceRow}>
                <Text style={styles.preferenceLabel}>Hybrid</Text>
                <Switch
                  value={profile.jobPreferences.hybrid}
                  onValueChange={(value) => handleJobPreferenceChange('hybrid', value)}
                />
              </View>
            </View>
          </View>

          {/* Resume */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resume</Text>

            {resumeFile ? (
              <View style={styles.resumeInfo}>
                <Text style={styles.resumeName}>{resumeFile.name}</Text>
                <Text style={styles.resumeSize}>
                  {UploadService.formatFileSize(resumeFile.size)}
                </Text>
                <TouchableOpacity
                  onPress={handleUploadResume}
                  disabled={uploading}
                  style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.uploadButtonText}>Upload Resume</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={handlePickResume} style={styles.pickResumeButton}>
                <MaterialIcons name="attach-file" size={20} color="#3498db" />
                <Text style={styles.pickResumeText}>Pick Resume (PDF)</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSaveProfile}
            disabled={loading}
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </RoleGuard>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#2c3e50' },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#2c3e50' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 },
  inputGroup: { flex: 1, marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#34495e' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f8f9fa' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },

  educationItem: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 8, marginBottom: 15 },
  experienceItem: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 8, marginBottom: 15 },
  projectItem: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 8, marginBottom: 15 },

  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  preferenceContainer: { marginBottom: 20 },
  preferenceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  preferenceLabel: { fontSize: 16, color: '#34495e' },

  pickResumeButton: { flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1, borderColor: '#3498db', borderRadius: 8, backgroundColor: '#f8f9fa', justifyContent: 'center' },
  pickResumeText: { color: '#3498db', fontWeight: '500', marginLeft: 5 },
  resumeInfo: { padding: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#f8f9fa' },
  resumeName: { fontSize: 14, fontWeight: '500', color: '#2c3e50', marginBottom: 2 },
  resumeSize: { fontSize: 12, color: '#7f8c8d', marginBottom: 10 },
  uploadButton: { backgroundColor: '#27ae60', padding: 12, borderRadius: 8, alignItems: 'center' },
  uploadButtonDisabled: { backgroundColor: '#bdc3c7' },
  uploadButtonText: { color: 'white', fontWeight: 'bold' },

  saveButton: { backgroundColor: '#3498db', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  saveButtonDisabled: { backgroundColor: '#bdc3c7' },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3498db', padding: 10, borderRadius: 8, marginTop: 5, justifyContent: 'center' },
  addButtonText: { color: 'white', fontWeight: 'bold', marginLeft: 5 },
  removeButton: { marginLeft: 5 },
});

export default JobSeekerEditProfileScreen;
