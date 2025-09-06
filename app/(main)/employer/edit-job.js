import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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

const EmployerEditJob = () => {
  const { user, userData } = useAuth();
  const { jobId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
    if (jobId) {
      loadJobData();
    }
  }, [jobId]);

  useEffect(() => {
    // Pre-fill company name if available
    if (userData?.companyName && !formData.company) {
      setFormData(prev => ({ ...prev, company: userData.companyName }));
    }
  }, [userData]);

  const loadJobData = async () => {
    if (!jobId) return;

    try {
      const result = await JobService.getJobById(jobId);
      if (result.success) {
        const job = result.data;
        setFormData({
          title: job.title || '',
          company: job.company || '',
          location: job.location || '',
          jobType: job.jobType || '',
          experienceLevel: job.experienceLevel || '',
          salary: job.salary || '',
          description: job.description || '',
          requirements: job.requirements ? job.requirements.join('\n') : ''
        });
      } else {
        Alert.alert('Error', 'Failed to load job data');
        router.back();
      }
    } catch (error) {
      console.error('Error loading job:', error);
      Alert.alert('Error', 'Failed to load job data');
      router.back();
    } finally {
      setInitialLoading(false);
    }
  };

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

  const handleUpdateJob = async () => {
    if (!validateForm()) return;
    if (!user || !jobId) return;

    setLoading(true);
    try {
      const jobData = {
        ...formData,
        requirements: formData.requirements.split('\n').filter(req => req.trim()),
      };

      const result = await JobService.updateJob(jobId, jobData);

      if (result.success) {
        Alert.alert(
          'Success!',
          'Job updated successfully!',
          [
            {
              text: 'View My Jobs',
              onPress: () => router.push('/(main)/employer/jobs')
            },
            {
              text: 'Stay Here',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update job. Please try again.');
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

  if (initialLoading) {
    return (
      <RoleGuard requiredRole="employer">
        <View style={styles.loadingContainer}>
          <Text>Loading job data...</Text>
        </View>
      </RoleGuard>
    );
  }

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
            <Text style={styles.headerTitle}>Edit Job</Text>
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

        {/* Update Job Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.updateButton, loading && styles.updateButtonDisabled]}
            onPress={handleUpdateJob}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.updateButtonText}>Updating...</Text>
            ) : (
              <>
                <FontAwesome5 name="edit" size={18} color="white" />
                <Text style={styles.updateButtonText}>Update Job</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f39c12',
    paddingVertical: 15,
    borderRadius: 8,
  },
  updateButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default EmployerEditJob;
