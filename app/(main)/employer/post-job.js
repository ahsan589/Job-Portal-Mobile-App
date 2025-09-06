import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import RoleGuard from '../../../src/components/RoleGuard';
import { useAuth } from '../../../src/contexts/AuthContext';
import { JobService } from '../../../src/services/jobService';

const EmployerPostJob = () => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    jobType: '',
    experienceLevel: '',
    salary: '',
    description: '',
    requirements: ''
  });

  useEffect(() => {
    // Pre-fill company name if available
    if (userData?.companyName) {
      setFormData(prev => ({ ...prev, company: userData.companyName }));
    }
  }, [userData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const requiredFields = ['title', 'company', 'location', 'jobType', 'experienceLevel', 'description'];
    const missingFields = requiredFields.filter(field => !formData[field]?.trim());

    if (missingFields.length > 0) {
      Alert.alert('Missing Information', `Please fill in: ${missingFields.join(', ')}`);
      return false;
    }
    return true;
  };

  const handlePostJob = async () => {
    if (!validateForm()) return;
    if (!user) return;

    setLoading(true);
    try {
      const jobData = {
        ...formData,
        requirements: formData.requirements.split('\n').filter(req => req.trim()),
        employerId: user.uid,
        postedAt: new Date(),
        status: 'active',
        applicationsCount: 0
      };

      const result = await JobService.postJob(user.uid, jobData);

      if (result.success) {
        Alert.alert(
          'Success!',
          'Job posted successfully!',
          [
            {
              text: 'View My Jobs',
              onPress: () => router.push('/(main)/employer/jobs')
            },
            {
              text: 'Post Another',
              onPress: () => {
                setFormData({
                  title: '',
                  company: userData?.companyName || '',
                  location: '',
                  jobType: '',
                  experienceLevel: '',
                  salary: '',
                  description: '',
                  requirements: ''
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const jobTypeOptions = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
  const experienceOptions = ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'];

  const renderJobTypeButtons = () => (
    <View style={styles.optionsContainer}>
      {jobTypeOptions.map((type) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.optionButton,
            formData.jobType === type && styles.optionButtonSelected
          ]}
          onPress={() => setFormData(prev => ({ ...prev, jobType: type }))}
        >
          <Text style={[
            styles.optionText,
            formData.jobType === type && styles.optionTextSelected
          ]}>
            {type}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderExperienceButtons = () => (
    <View style={styles.optionsContainer}>
      {experienceOptions.map((level) => (
        <TouchableOpacity
          key={level}
          style={[
            styles.optionButton,
            formData.experienceLevel === level && styles.optionButtonSelected
          ]}
          onPress={() => setFormData(prev => ({ ...prev, experienceLevel: level }))}
        >
          <Text style={[
            styles.optionText,
            formData.experienceLevel === level && styles.optionTextSelected
          ]}>
            {level}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <RoleGuard requiredRole="employer">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#3498db" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Post New Job</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Job Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Job Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Senior React Developer"
                value={formData.title}
                onChangeText={(value) => setFormData(prev => ({ ...prev, title: value }))}
              />
            </View>

            {/* Company */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Your company name"
                value={formData.company}
                onChangeText={(value) => setFormData(prev => ({ ...prev, company: value }))}
              />
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. New York, NY or Remote"
                value={formData.location}
                onChangeText={(value) => setFormData(prev => ({ ...prev, location: value }))}
              />
            </View>

            {/* Job Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Job Type *</Text>
              {renderJobTypeButtons()}
            </View>

            {/* Experience Level */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Experience Level *</Text>
              {renderExperienceButtons()}
            </View>

            {/* Salary */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Salary (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. $80,000 - $100,000 per year"
                value={formData.salary}
                onChangeText={(value) => setFormData(prev => ({ ...prev, salary: value }))}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Job Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe the role, responsibilities, and what you're looking for in a candidate..."
                value={formData.description}
                onChangeText={(value) => setFormData(prev => ({ ...prev, description: value }))}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            {/* Requirements */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Requirements (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="List the key requirements, skills, or qualifications (one per line)..."
                value={formData.requirements}
                onChangeText={(value) => setFormData(prev => ({ ...prev, requirements: value }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        {/* Post Job Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.postButton, loading && styles.postButtonDisabled]}
            onPress={handlePostJob}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.postButtonText}>Posting...</Text>
            ) : (
              <>
                <FontAwesome5 name="plus" size={18} color="white" />
                <Text style={styles.postButtonText}>Post Job</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </RoleGuard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#2c3e50',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  optionButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  optionText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  optionTextSelected: {
    color: 'white',
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  postButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 8,
  },
  postButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  postButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default EmployerPostJob;
