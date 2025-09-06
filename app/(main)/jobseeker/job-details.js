import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ResumePicker from '../../../src/components/ResumePicker';
import RoleGuard from '../../../src/components/RoleGuard';
import { useAuth } from '../../../src/contexts/AuthContext';
import { JobService } from '../../../src/services/jobService';
import { UploadService } from '../../../src/utils/uploadService';

const JobSeekerJobDetails = () => {
  const { user } = useAuth();
  const { jobId, applyAfterView } = useLocalSearchParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (jobId) {
      loadJobDetails();
    }
  }, [jobId]);

  const loadJobDetails = async () => {
    if (!jobId) {
      Alert.alert('Error', 'Job ID not found');
      router.back();
      return;
    }

    setLoading(true);
    const result = await JobService.getJobById(jobId);
    setLoading(false);

    if (result.success) {
      setJob(result.data);
      // Check if user has already applied
      if (user && result.data.applications) {
        setHasApplied(result.data.applications.some(app => app.userId === user.uid));
      }
    } else {
      Alert.alert('Error', result.error || 'Job not found');
      router.back();
    }
  };

  const handleApply = async () => {
    if (!user || !job) return;

    if (!selectedResume) {
      Alert.alert('Resume Required', 'Please select a resume to apply for this job.');
      return;
    }

    setApplying(true);
    try {
      // Use already-uploaded URL from ResumePicker when available; otherwise upload local URI
      let resumeUrl = selectedResume.url || selectedResume.uri;
      if ((!resumeUrl || !resumeUrl.startsWith('http')) && selectedResume.uri) {
        const uploadResult = await UploadService.uploadFile(selectedResume.uri, 'resumes');
        if (uploadResult.success) {
          resumeUrl = uploadResult.url;
        } else {
          Alert.alert('Upload Failed', 'Failed to upload resume. Please try again.');
          setApplying(false);
          return;
        }
      }

      // Submit application
      const applicationData = {
        resumeUrl: resumeUrl,
        coverLetter: 'I am interested in this position.'
      };

      const result = await JobService.applyForJob(user.uid, jobId, applicationData);

      if (result.success) {
        Alert.alert('Success', 'Application submitted successfully!');
        setHasApplied(true);
      } else {
        Alert.alert('Error', result.error || 'Failed to submit application');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while applying');
    }
    setApplying(false);
  };

  if (loading) {
    return (
      <RoleGuard requiredRole="jobseeker">
        <View style={styles.loadingContainer} collapsable={false}>
          <Text>Loading job details...</Text>
        </View>
      </RoleGuard>
    );
  }

  if (!job) {
    return (
      <RoleGuard requiredRole="jobseeker">
        <View style={styles.errorContainer} collapsable={false}>
          <MaterialIcons name="error" size={64} color="#e74c3c" />
          <Text style={styles.errorText}>Job not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="jobseeker">
      <View style={styles.container} collapsable={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#3498db" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Job Header */}
          <View style={styles.jobHeader}>
            <View style={styles.companyInfo}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.companyName}>{job.company}</Text>
            </View>
            {!hasApplied && (
              <TouchableOpacity
                style={[styles.applyButton, (!selectedResume || applying) && styles.disabledButton]}
                onPress={handleApply}
                disabled={!selectedResume || applying}
              >
                <Text style={styles.applyButtonText}>
                  {applying ? 'Applying...' : 'Apply Now'}
                </Text>
              </TouchableOpacity>
            )}
            {hasApplied && (
              <View style={styles.appliedBadge}>
                <Text style={styles.appliedText}>Applied</Text>
              </View>
            )}
          </View>

          {/* Job Details */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color="#7f8c8d" />
              <Text style={styles.detailText}>{job.location}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="work" size={20} color="#7f8c8d" />
              <Text style={styles.detailText}>{job.jobType}</Text>
            </View>
            <View style={styles.detailRow}>
              <FontAwesome5 name="user-graduate" size={18} color="#7f8c8d" />
              <Text style={styles.detailText}>{job.experienceLevel}</Text>
            </View>
            <View style={styles.detailRow}>
              <FontAwesome5 name="clock" size={18} color="#7f8c8d" />
              <Text style={styles.detailText}>
                Posted {job.postedAt?.toDate ? job.postedAt.toDate().toLocaleDateString() : 'Recently'}
              </Text>
            </View>
            {job.salary && (
              <View style={styles.detailRow}>
                <FontAwesome5 name="money-bill-wave" size={18} color="#27ae60" />
                <Text style={styles.salaryText}>{job.salary}</Text>
              </View>
            )}
          </View>

          {/* Job Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Description</Text>
            <Text style={styles.sectionContent}>{job.description}</Text>
          </View>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requirements</Text>
              {job.requirements.map((requirement, index) => (
                <View key={index} style={styles.requirementRow}>
                  <MaterialIcons name="check-circle" size={16} color="#27ae60" />
                  <Text style={styles.requirementText}>{requirement}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Company Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About {job.company}</Text>
            <Text style={styles.sectionContent}>
              This position is with {job.company}. Join our team and be part of an innovative company
              committed to excellence and growth.
            </Text>
          </View>

          {/* Resume Selection */}
          {!hasApplied && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Resume to Apply</Text>
              <ResumePicker
                currentResume={selectedResume}
                onResumeSelected={setSelectedResume}
              />
              {selectedResume && (
                <Text style={styles.selectedResumeText}>
                  Selected: {selectedResume.name || 'Resume'}
                </Text>
              )}
            </View>
          )}

          {/* Applications Count */}
          <View style={styles.applicationsSection}>
            <Text style={styles.applicationsText}>
              {job.applicationsCount || 0} people have applied for this job
            </Text>
          </View>
        </ScrollView>

        {/* Apply Button (Fixed at bottom) */}
        {!hasApplied && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerApplyButton, (!selectedResume || applying) && styles.disabledButton]}
              onPress={handleApply}
              disabled={!selectedResume || applying}
            >
              <FontAwesome5 name="paper-plane" size={18} color="white" />
              <Text style={styles.footerApplyText}>
                {applying ? 'Applying...' : 'Apply for this Job'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
    backgroundColor: '#f8f9fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginTop: 15,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  scrollView: {
    flex: 1,
  },
  jobHeader: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companyInfo: {
    marginBottom: 15,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  companyName: {
    fontSize: 18,
    color: '#3498db',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  appliedBadge: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  appliedText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailsSection: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 12,
    color: '#34495e',
    fontSize: 16,
  },
  salaryText: {
    marginLeft: 12,
    color: '#27ae60',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  sectionContent: {
    color: '#34495e',
    fontSize: 16,
    lineHeight: 24,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  requirementText: {
    marginLeft: 12,
    color: '#34495e',
    fontSize: 16,
    flex: 1,
  },
  applicationsSection: {
    backgroundColor: '#ecf0f1',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 8,
  },
  applicationsText: {
    color: '#7f8c8d',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  footerApplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 8,
  },
  footerApplyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  selectedResumeText: {
    marginTop: 10,
    color: '#27ae60',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default JobSeekerJobDetails;
