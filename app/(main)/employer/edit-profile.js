// app/(main)/employer/edit-profile.js
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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ImagePickerComponent from '../../../src/components/ImagePicker';
import RoleGuard from '../../../src/components/RoleGuard';
import { useAuth } from '../../../src/contexts/AuthContext';
import { ProfileService } from '../../../src/services/profileService';

const EmployerEditProfileScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    companyName: '',
    companyDescription: '',
    industry: '',
    companySize: '',
    foundedYear: '',
    website: '',
    contactPerson: '',
    phone: '',
    address: '',
    linkedIn: '',
    twitter: '',
    facebook: '',
    companyCulture: [],
  });
  const [newCulture, setNewCulture] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (user) {
      const result = await ProfileService.getProfile(user.uid);
      if (result.success) {
        setProfile({
          ...result.data,
          companyCulture: result.data.companyCulture || [],
        });
      }
    }
  };

  const handleInputChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelected = async (imageUri) => {
    setUploading(true);
    const result = await ProfileService.uploadProfileImage(user.uid, imageUri);
    setUploading(false);

    if (result.success) {
      setProfile((prev) => ({ ...prev, companyLogo: result.url }));
      Alert.alert('Success', 'Company logo updated successfully');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleAddCulture = () => {
    if (newCulture.trim() && !profile.companyCulture.includes(newCulture.trim())) {
      setProfile((prev) => ({
        ...prev,
        companyCulture: [...prev.companyCulture, newCulture.trim()],
      }));
      setNewCulture('');
    }
  };

  const handleRemoveCulture = (cultureToRemove) => {
    setProfile((prev) => ({
      ...prev,
      companyCulture: prev.companyCulture.filter((c) => c !== cultureToRemove),
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const result = await ProfileService.updateEmployerProfile(user.uid, {
      ...profile,
      companyCulture: profile.companyCulture || [],
    });
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', result.message);
      router.back();
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <RoleGuard requiredRole="employer">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Edit Company Profile</Text>

        {/* Company Logo */}
        <ImagePickerComponent
          onImageSelected={handleImageSelected}
          currentImage={profile.companyLogo}
          label="Company Logo"
        />

        {/* Company Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={styles.input}
              value={profile.companyName}
              onChangeText={(text) => handleInputChange('companyName', text)}
              placeholder="Enter company name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Industry *</Text>
            <TextInput
              style={styles.input}
              value={profile.industry}
              onChangeText={(text) => handleInputChange('industry', text)}
              placeholder="e.g., Technology, Healthcare"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={profile.companyDescription}
              onChangeText={(text) => handleInputChange('companyDescription', text)}
              placeholder="Describe your company..."
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company Size</Text>
              <TextInput
                style={styles.input}
                value={profile.companySize}
                onChangeText={(text) => handleInputChange('companySize', text)}
                placeholder="e.g., 50-100 employees"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Founded Year</Text>
              <TextInput
                style={styles.input}
                value={profile.foundedYear}
                onChangeText={(text) => handleInputChange('foundedYear', text)}
                placeholder="e.g., 2010"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={profile.website}
              onChangeText={(text) => handleInputChange('website', text)}
              placeholder="https://yourcompany.com"
              keyboardType="url"
            />
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Person *</Text>
            <TextInput
              style={styles.input}
              value={profile.contactPerson}
              onChangeText={(text) => handleInputChange('contactPerson', text)}
              placeholder="Full name of contact person"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone *</Text>
            <TextInput
              style={styles.input}
              value={profile.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={profile.address}
              onChangeText={(text) => handleInputChange('address', text)}
              placeholder="Company address"
            />
          </View>
        </View>

        {/* Social Media */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>LinkedIn</Text>
            <TextInput
              style={styles.input}
              value={profile.linkedIn}
              onChangeText={(text) => handleInputChange('linkedIn', text)}
              placeholder="LinkedIn company page URL"
              keyboardType="url"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Twitter</Text>
            <TextInput
              style={styles.input}
              value={profile.twitter}
              onChangeText={(text) => handleInputChange('twitter', text)}
              placeholder="Twitter profile URL"
              keyboardType="url"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Facebook</Text>
            <TextInput
              style={styles.input}
              value={profile.facebook}
              onChangeText={(text) => handleInputChange('facebook', text)}
              placeholder="Facebook page URL"
              keyboardType="url"
            />
          </View>
        </View>

        {/* Company Culture */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Culture</Text>

          <View style={styles.skillInputContainer}>
            <TextInput
              style={[styles.input, styles.skillInput]}
              value={newCulture}
              onChangeText={setNewCulture}
              placeholder="Add company culture value"
              onSubmitEditing={handleAddCulture}
            />
            <TouchableOpacity
              onPress={handleAddCulture}
              style={styles.addSkillButton}
            >
              <MaterialIcons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.skillsContainer}>
            {(profile.companyCulture || []).map((culture, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{culture}</Text>
                <TouchableOpacity onPress={() => handleRemoveCulture(culture)}>
                  <MaterialIcons name="close" size={16} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
  },
  section: { marginBottom: 25 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
  },
  row: { flexDirection: 'row', gap: 15 },
  inputGroup: { flex: 1, marginBottom: 15 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#34495e',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  skillInputContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  skillInput: { flex: 1 },
  addSkillButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3498db',
    gap: 5,
  },
  skillText: { color: '#3498db', fontSize: 12, fontWeight: '500' },
  saveButton: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: { backgroundColor: '#bdc3c7' },
  saveButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default EmployerEditProfileScreen;
