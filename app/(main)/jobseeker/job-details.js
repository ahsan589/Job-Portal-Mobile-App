import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  RefreshControl,
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
import { messageService } from '../../../src/services/messageService';
import { UploadService } from '../../../src/utils/uploadService';

const { width } = Dimensions.get('window');

const JobSeekerJobDetails = () => {
  const { user } = useAuth();
  const { jobId, applyAfterView } = useLocalSearchParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  const [applying, setApplying] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [headerScroll] = useState(new Animated.Value(0));

  useEffect(() => {
    if (jobId) {
      loadJobDetails();
    }
  }, [jobId]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

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
      if (user && result.data.applications) {
        setHasApplied(result.data.applications.some(app => app.userId === user.uid));
      }
    } else {
      Alert.alert('Error', result.error || 'Job not found');
      router.back();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobDetails();
    setRefreshing(false);
  };

  const handleApply = async () => {
    if (!user || !job) return;

    if (!selectedResume) {
      Alert.alert('Resume Required', 'Please select a resume to apply for this job.');
      return;
    }

    setApplying(true);
    try {
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

      const applicationData = {
        resumeUrl: resumeUrl,
        coverLetter: 'I am interested in this position.'
      };

      const result = await JobService.applyForJob(user.uid, jobId, applicationData);

      if (result.success) {
        Alert.alert('Success', '🎉 Application submitted successfully!');
        setHasApplied(true);
      } else {
        Alert.alert('Error', result.error || 'Failed to submit application');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while applying');
    }
    setApplying(false);
  };

  const handleMessage = async () => {
    if (!user || !job) return;

    setMessaging(true);
    try {
      const result = await messageService.createConversation(job.employerId, user.uid, jobId);

      if (result.success) {
        router.push({
          pathname: '/(main)/jobseeker/message',
          params: { conversationId: result.id }
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'An unexpected error occurred while starting conversation');
    }
    setMessaging(false);
  };

  const headerOpacity = headerScroll.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const getTimeAgo = (timestamp) => {
    if (!timestamp?.toDate) return 'Recently';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getJobTypeColor = (jobType) => {
    const colors = {
      'Full-time': '#10b981',
      'Part-time': '#f59e0b',
      'Contract': '#8b5cf6',
      'Internship': '#06b6d4',
      'Remote': '#ef4444'
    };
    return colors[jobType] || '#6b7280';
  };

  if (loading) {
    return (
      <RoleGuard requiredRole="jobseeker">
        <View style={styles.loadingContainer} collapsable={false}>
          <Animated.View style={[styles.loadingCard, { opacity: fadeAnim }]}>
            <View style={styles.loadingAnimation}>
              <MaterialIcons name="work" size={64} color="#e0e0e0" />
            </View>
            <Text style={styles.loadingText}>Loading job details...</Text>
            <Text style={styles.loadingSubtext}>Getting everything ready for you</Text>
          </Animated.View>
        </View>
      </RoleGuard>
    );
  }

  if (!job) {
    return (
      <RoleGuard requiredRole="jobseeker">
        <View style={styles.errorContainer} collapsable={false}>
          <MaterialIcons name="error-outline" size={80} color="#e74c3c" />
          <Text style={styles.errorTitle}>Job Not Found</Text>
          <Text style={styles.errorDescription}>
            The job you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="white" />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="jobseeker">
      <View style={styles.container} collapsable={false}>
        {/* Animated Header */}
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <TouchableOpacity
            style={styles.backButtonHeader}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {job.title}
          </Text>
          <View style={{ width: 24 }} />
        </Animated.View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3498db']}
              tintColor="#3498db"
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: headerScroll } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {/* Hero Section */}
          <Animated.View style={[styles.heroSection, { opacity: fadeAnim }]}>
            <View style={styles.heroBackground} />
            <View style={styles.heroContent}>
              <View style={styles.jobTypeBadge}>
                <View style={[styles.jobTypeDot, { backgroundColor: getJobTypeColor(job.jobType) }]} />
                <Text style={styles.jobTypeText}>{job.jobType}</Text>
              </View>
              
              <Text style={styles.jobTitle}>{job.title}</Text>
              
              <View style={styles.companySection}>
                <View style={styles.companyAvatar}>
                  <Text style={styles.companyAvatarText}>
                    {job.company?.charAt(0)?.toUpperCase() || 'C'}
                  </Text>
                </View>
                <View style={styles.companyInfo}>
                  <Text style={styles.companyName}>{job.company}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.companyLocation}>{job.location}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <MaterialIcons name="schedule" size={20} color="#3498db" />
                <Text style={styles.statText}>{getTimeAgo(job.postedAt)}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialIcons name="people" size={20} color="#e74c3c" />
                <Text style={styles.statText}>{job.applicationsCount || 0} applicants</Text>
              </View>
            </View>
          </Animated.View>

          {/* Action Card */}
          <Animated.View style={[styles.actionCard, { opacity: fadeAnim }]}>
            {!hasApplied ? (
              <View style={styles.applySection}>
                <View style={styles.applyHeader}>
                  <View style={styles.applyIcon}>
                    <FontAwesome5 name="paper-plane" size={20} color="#3498db" />
                  </View>
                  <View>
                    <Text style={styles.applyTitle}>Ready to Apply?</Text>
                    <Text style={styles.applyDescription}>
                      Submit your application to {job.company}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.resumeSection}>
                  <Text style={styles.resumeLabel}>Select Your Resume</Text>
                  <ResumePicker
                    currentResume={selectedResume}
                    onResumeSelected={setSelectedResume}
                  />
                </View>
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.primaryButton,
                      (!selectedResume || applying) && styles.disabledButton
                    ]}
                    onPress={handleApply}
                    disabled={!selectedResume || applying}
                  >
                    {applying ? (
                      <View style={styles.spinner} />
                    ) : (
                      <FontAwesome5 name="paper-plane" size={18} color="white" />
                    )}
                    <Text style={styles.primaryButtonText}>
                      {applying ? 'Applying...' : 'Apply Now'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.secondaryButton, messaging && styles.disabledButton]}
                    onPress={handleMessage}
                    disabled={messaging}
                  >
                    <Ionicons 
                      name={messaging ? "time" : "chatbubble-ellipses"} 
                      size={18} 
                      color="#3498db" 
                    />
                    <Text style={styles.secondaryButtonText}>
                      {messaging ? 'Starting...' : 'Message'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.appliedSection}>
                <View style={styles.successBadge}>
                  <View style={styles.successIcon}>
                    <MaterialIcons name="check-circle" size={32} color="#27ae60" />
                  </View>
                  <Text style={styles.successTitle}>Application Submitted!</Text>
                  <Text style={styles.successDescription}>
                    Your application has been sent to {job.company}. The employer will review your profile.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.messageButtonLarge}
                  onPress={handleMessage}
                  disabled={messaging}
                >
                  <Ionicons 
                    name={messaging ? "time" : "chatbubble-ellipses"} 
                    size={20} 
                    color="white" 
                  />
                  <Text style={styles.messageButtonLargeText}>
                    {messaging ? 'Starting Chat...' : 'Message Employer'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* Job Details Grid */}
          <Animated.View style={[styles.detailsCard, { opacity: fadeAnim }]}>
            <Text style={styles.cardTitle}>Job Details</Text>
            
            <View style={styles.detailGrid}>
              <View style={styles.detailItem}>
                <View style={[styles.detailIcon, { backgroundColor: '#e3f2fd' }]}>
                  <Ionicons name="location" size={20} color="#1976d2" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{job.location}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={[styles.detailIcon, { backgroundColor: '#f3e5f5' }]}>
                  <MaterialIcons name="work" size={20} color="#7b1fa2" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Job Type</Text>
                  <Text style={styles.detailValue}>{job.jobType}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <View style={[styles.detailIcon, { backgroundColor: '#e8f5e8' }]}>
                  <FontAwesome5 name="user-graduate" size={18} color="#2e7d32" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Experience</Text>
                  <Text style={styles.detailValue}>{job.experienceLevel}</Text>
                </View>
              </View>

              {job.salary && (
                <View style={styles.detailItem}>
                  <View style={[styles.detailIcon, { backgroundColor: '#fff8e1' }]}>
                    <FontAwesome5 name="money-bill-wave" size={18} color="#f57c00" />
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Salary</Text>
                    <Text style={[styles.detailValue, styles.salaryValue]}>{job.salary}</Text>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Job Description */}
          <Animated.View style={[styles.contentCard, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="description" size={24} color="#2c3e50" />
              <Text style={styles.sectionTitle}>Job Description</Text>
            </View>
            <Text style={styles.contentText}>{job.description}</Text>
          </Animated.View>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <Animated.View style={[styles.contentCard, { opacity: fadeAnim }]}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="checklist" size={24} color="#2c3e50" />
                <Text style={styles.sectionTitle}>Requirements</Text>
              </View>
              <View style={styles.requirementsList}>
                {job.requirements.map((requirement, index) => (
                  <View key={index} style={styles.requirementItem}>
                    <View style={styles.requirementBullet}>
                      <MaterialIcons name="check" size={14} color="white" />
                    </View>
                    <Text style={styles.requirementText}>{requirement}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* About Company */}
          <Animated.View style={[styles.contentCard, { opacity: fadeAnim }]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="business" size={24} color="#2c3e50" />
              <Text style={styles.sectionTitle}>About {job.company}</Text>
            </View>
            <Text style={styles.contentText}>
              {job.companyDescription || `Join ${job.company}, a forward-thinking organization committed to excellence and innovation. We value our team members and provide opportunities for professional growth and development.`}
            </Text>
            
            <View style={styles.companyStats}>
              <View style={styles.companyStat}>
                <Text style={styles.companyStatNumber}>50+</Text>
                <Text style={styles.companyStatLabel}>Employees</Text>
              </View>
              <View style={styles.companyStat}>
                <Text style={styles.companyStatNumber}>2015</Text>
                <Text style={styles.companyStatLabel}>Founded</Text>
              </View>
              <View style={styles.companyStat}>
                <Text style={styles.companyStatNumber}>15+</Text>
                <Text style={styles.companyStatLabel}>Countries</Text>
              </View>
            </View>
          </Animated.View>

          {/* Spacer for fixed button */}
          {!hasApplied && <View style={styles.bottomSpacer} />}
        </ScrollView>

        {/* Fixed Apply Button */}
        {!hasApplied && (
          <Animated.View style={[styles.fixedFooter, { opacity: fadeAnim }]}>
            <View style={styles.footerContent}>
              <View style={styles.footerInfo}>
                <Text style={styles.footerJobTitle} numberOfLines={1}>
                  {job.title}
                </Text>
                <Text style={styles.footerCompany} numberOfLines={1}>
                  {job.company} • {job.location}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.footerApplyButton,
                  (!selectedResume || applying) && styles.disabledButton
                ]}
                onPress={handleApply}
                disabled={!selectedResume || applying}
              >
                {applying ? (
                  <View style={styles.footerSpinner} />
                ) : (
                  <FontAwesome5 name="paper-plane" size={18} color="white" />
                )}
                <Text style={styles.footerApplyText}>
                  {applying ? 'Applying...' : 'Apply Now'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>
    </RoleGuard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  loadingCard: {
    alignItems: 'center',
    padding: 40,
  },
  loadingAnimation: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d3748',
    marginTop: 20,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonHeader: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f7fafc',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#3498db',
    paddingTop: 80,
    paddingBottom: 30,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#3498db',
  },
  heroContent: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  jobTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  jobTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  jobTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  jobTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 20,
    lineHeight: 34,
  },
  companySection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  companyAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyLocation: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 16,
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: -20,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  applyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  applyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ebf5ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  applyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 4,
  },
  applyDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  resumeSection: {
    marginBottom: 20,
  },
  resumeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  disabledButton: {
    backgroundColor: '#cbd5e0',
    shadowOpacity: 0,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  spinner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'white',
    borderTopColor: 'transparent',
  },
  appliedSection: {
    alignItems: 'center',
  },
  successBadge: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#27ae60',
    marginBottom: 8,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 22,
  },
  messageButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  messageButtonLargeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  detailsCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 20,
  },
  detailGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#2d3748',
    fontWeight: '600',
  },
  salaryValue: {
    color: '#27ae60',
  },
  contentCard: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    marginLeft: 12,
  },
  contentText: {
    fontSize: 16,
    color: '#4a5568',
    lineHeight: 24,
  },
  requirementsList: {
    gap: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  requirementBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  requirementText: {
    fontSize: 16,
    color: '#4a5568',
    lineHeight: 22,
    flex: 1,
  },
  companyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  companyStat: {
    alignItems: 'center',
  },
  companyStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3498db',
    marginBottom: 4,
  },
  companyStatLabel: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 100,
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerInfo: {
    flex: 1,
    marginRight: 16,
  },
  footerJobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 2,
  },
  footerCompany: {
    fontSize: 14,
    color: '#718096',
  },
  footerApplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  footerApplyText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  footerSpinner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'white',
    borderTopColor: 'transparent',
  },
});

export default JobSeekerJobDetails;