import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import RoleGuard from '../../../src/components/RoleGuard';
import { useAuth } from '../../../src/contexts/AuthContext';
import { JobService } from '../../../src/services/jobService';
import { messageService } from '../../../src/services/messageService';

const ApplicationDetails = () => {
  const { applicationId } = useLocalSearchParams();
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);
  const [showResume, setShowResume] = useState(false);

  useEffect(() => {
    if (applicationId) {
      loadApplicationDetails(applicationId);
    }
  }, [applicationId]);

  const loadApplicationDetails = async (id) => {
    setLoading(true);
    try {
      const result = await JobService.getApplicationById(id);
      if (result.success) {
        console.log('Application data loaded:', result.data);
        console.log('Applicant name field:', result.data.applicantName);
        console.log('All applicant fields:', {
          applicantName: result.data.applicantName,
          name: result.data.name,
          fullName: result.data.fullName,
          userName: result.data.userName
        });
        setApplication(result.data);
      } else {
        Alert.alert('Error', result.error || 'Application not found');
      }
    } catch (error) {
      console.error('Error loading application:', error);
      Alert.alert('Error', 'Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResume = () => {
    if (!application?.resumeUrl) return;
    setShowResume(true);
  };

  const handleCloseResume = () => {
    setShowResume(false);
  };

  const handleDownloadResume = async () => {
    if (!application?.resumeUrl) return;

    try {
      // For data URLs, use Share API with download option
      if (application.resumeUrl.startsWith('data:')) {
        const fileName = application.resumeFileName || 'resume.pdf';
        await Share.share({
          url: application.resumeUrl,
          message: 'Resume',
          title: fileName,
        });
      } else {
        // For regular URLs, try to open in browser for download
        const supported = await Linking.canOpenURL(application.resumeUrl);
        if (supported) {
          await Linking.openURL(application.resumeUrl);
        } else {
          Alert.alert('Error', 'Cannot download resume');
        }
      }
    } catch (error) {
      console.error('Error downloading resume:', error);
      Alert.alert('Error', 'Failed to download resume');
    }
  };

  const handleMessageCandidate = async () => {
    if (!application || !user) return;

    setMessaging(true);
    try {
      // Get the applicant user ID from the application
      const applicantId = application.applicantId || application.userId;
      if (!applicantId) {
        Alert.alert('Error', 'Cannot find applicant information');
        return;
      }

      // Create or get conversation - employer initiates conversation
      const conversationResult = await messageService.createConversation(
        user.uid, // employer ID
        applicantId, // job seeker ID
        application.jobId // job ID for context
      );

      if (conversationResult.success) {
        // Navigate to employer messages with the conversation ID
        router.push({
          pathname: '/(main)/employer/message',
          params: { conversationId: conversationResult.id }
        });
      } else {
        Alert.alert('Error', conversationResult.error || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    } finally {
      setMessaging(false);
    }
  };

  if (loading) {
    return (
      <RoleGuard requiredRole="employer">
        <View style={styles.loadingContainer}>
          <Text>Loading application details...</Text>
        </View>
      </RoleGuard>
    );
  }

  if (!application) {
    return (
      <RoleGuard requiredRole="employer">
        <View style={styles.container}>
          <Text style={styles.errorText}>Application details not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="employer">
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={styles.header}>Application Details</Text>

          {/* Candidate Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Candidate Information</Text>

            <View style={styles.fieldRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>
                {application.applicantName || application.name || application.fullName || application.userName || 'N/A'}
              </Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{application.applicantEmail || 'N/A'}</Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{application.applicantPhone || 'N/A'}</Text>
            </View>

            {application.applicantSkills && application.applicantSkills.length > 0 && (
              <View style={styles.fieldRow}>
                <Text style={styles.label}>Skills:</Text>
                <Text style={styles.value}>{application.applicantSkills.join(', ')}</Text>
              </View>
            )}

            {application.applicantExperience && Array.isArray(application.applicantExperience) && application.applicantExperience.length > 0 ? (
              <View style={styles.fieldRow}>
                <Text style={styles.label}>Experience:</Text>
                <View style={styles.experienceContainer}>
                  {application.applicantExperience.map((exp, index) => (
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
              </View>
            ) : (
              <View style={styles.fieldRow}>
                <Text style={styles.label}>Experience:</Text>
                <Text style={styles.value}>N/A</Text>
              </View>
            )}

            {application.applicantEducation && Array.isArray(application.applicantEducation) && application.applicantEducation.length > 0 ? (
              <View style={styles.fieldRow}>
                <Text style={styles.label}>Education:</Text>
                <View style={styles.educationContainer}>
                  {application.applicantEducation.map((edu, index) => (
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
              </View>
            ) : (
              <View style={styles.fieldRow}>
                <Text style={styles.label}>Education:</Text>
                <Text style={styles.value}>N/A</Text>
              </View>
            )}
          </View>

          {/* Job Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Information</Text>

            <View style={styles.fieldRow}>
              <Text style={styles.label}>Job Title:</Text>
              <Text style={styles.value}>{application.jobTitle || 'N/A'}</Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.label}>Company:</Text>
              <Text style={styles.value}>{application.companyName || 'N/A'}</Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.label}>Status:</Text>
              <Text style={styles.value}>{application.status || 'N/A'}</Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.label}>Applied At:</Text>
              <Text style={styles.value}>
                {application.appliedAt?.toDate ? application.appliedAt.toDate().toLocaleString() : 'N/A'}
              </Text>
            </View>
          </View>

          {/* Application Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Application Details</Text>

            <View style={styles.fieldRow}>
              <Text style={styles.label}>Cover Letter:</Text>
              <Text style={styles.value}>{application.coverLetter || 'N/A'}</Text>
            </View>

            {application.resumeUrl && (
              <View style={styles.fieldRow}>
                <Text style={styles.label}>Resume:</Text>
                <View style={styles.resumeActions}>
                  <TouchableOpacity onPress={handleViewResume} style={styles.resumeButton}>
                    <Text style={[styles.value, styles.link]}>
                      View Resume
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDownloadResume} style={styles.resumeButton}>
                    <Text style={[styles.value, styles.link]}>
                      Download Resume
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={handleMessageCandidate}
              style={[styles.messageButton, messaging && styles.buttonDisabled]}
              disabled={messaging}
            >
              <Text style={styles.messageButtonText}>
                {messaging ? 'Starting Conversation...' : 'Message Candidate'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Back to Candidates</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Resume WebView Modal */}
        {showResume && (
          <View style={styles.webViewModal}>
            <View style={styles.webViewHeader}>
              <TouchableOpacity onPress={handleCloseResume} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close Resume</Text>
              </TouchableOpacity>
            </View>
            <WebView
              source={{ uri: application.resumeUrl }}
              style={styles.webView}
              startInLoadingState={true}
              scalesPageToFit={true}
            />
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
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
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
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    paddingBottom: 10,
  },
  fieldRow: {
    marginBottom: 12,
  },
  label: {
    fontWeight: 'bold',
    color: '#34495e',
    marginBottom: 5,
    fontSize: 16,
  },
  value: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 22,
  },
  link: {
    color: '#3498db',
    textDecorationLine: 'underline',
  },
  experienceContainer: {
    marginTop: 5,
  },
  experienceItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  experiencePosition: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
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
  educationContainer: {
    marginTop: 5,
  },
  educationItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#27ae60',
  },
  educationDegree: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  educationSchool: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  educationPeriod: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 4,
  },
  educationGrades: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '500',
  },
  resumeActions: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 5,
  },
  resumeButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  actionButtons: {
    gap: 12,
    marginTop: 20,
  },
  messageButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  messageButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  webViewModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 1000,
  },
  webViewHeader: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  webView: {
    flex: 1,
  },
});

export default ApplicationDetails;