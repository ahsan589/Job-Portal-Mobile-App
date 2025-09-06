// app/(main)/jobseeker/dashboard.js
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import RoleGuard from '../../../src/components/RoleGuard';
import { useAuth } from '../../../src/contexts/AuthContext';
import { JobService } from '../../../src/services/jobService';
import { ProfileService } from '../../../src/services/profileService';

const JobSeekerDashboard = () => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    applications: 0,
    interviews: 0,
    profileStrength: 0
  });
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [profile, setProfile] = useState(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadDashboardData();
    animateIn();
  }, [user]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load profile data
      const profileResult = await ProfileService.getProfile(user.uid);
      if (profileResult.success) {
        setProfile(profileResult.data);
        calculateProfileStrength(profileResult.data);
      }

      // Load applications count
      const applicationsResult = await JobService.getUserApplications(user.uid);
      if (applicationsResult.success) {
        const applications = applicationsResult.data || [];
        setStats(prev => ({
          ...prev,
          applications: applications.length,
          interviews: applications.filter(app => app.status === 'interview').length
        }));
      }

      // Load recommended jobs
      const jobsResult = await JobService.getJobs();
      if (jobsResult.success) {
        // Get first 3 jobs as recommended
        setRecommendedJobs(jobsResult.data.slice(0, 3));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileStrength = (profileData) => {
    let strength = 0;
    const totalFields = 8;

    if (profileData?.firstName) strength++;
    if (profileData?.lastName) strength++;
    if (profileData?.title) strength++;
    if (profileData?.bio) strength++;
    if (profileData?.skills?.length > 0) strength++;
    if (profileData?.experience?.length > 0) strength++;
    if (profileData?.education?.length > 0) strength++;
    if (profileData?.profileImage) strength++;

    setStats(prev => ({
      ...prev,
      profileStrength: Math.round((strength / totalFields) * 100)
    }));
  };

  const handleApply = async (jobId) => {
    if (!user) return;

    Alert.alert(
      'Apply for Job',
      'Are you sure you want to apply for this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            const result = await JobService.applyForJob(user.uid, jobId, {
              coverLetter: 'I am interested in this position.'
            });

            if (result.success) {
              Alert.alert('Success', 'Application submitted successfully!');
              // Refresh dashboard data
              loadDashboardData();
            } else {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };

  const quickActions = [
    {
      title: 'Search Jobs',
      icon: 'search',
      color: '#3498db',
      onPress: () => router.push('/(main)/jobseeker/jobs')
    },
    {
      title: 'My Applications',
      icon: 'file-text',
      color: '#2ecc71',
      onPress: () => router.push('/(main)/jobseeker/applications')
    },
    {
      title: 'Messages',
      icon: 'chat',
      color: '#e67e22',
      onPress: () => router.push('/(main)/messages')
    },
    {
      title: 'Profile',
      icon: 'user',
      color: '#9b59b6',
      onPress: () => router.push('/(main)/jobseeker/profile')
    }
  ];

  return (
    <RoleGuard requiredRole="jobseeker">
      <ScrollView style={styles.container}>
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>
              {userData?.firstName || user?.email?.split('@')[0] || 'Job Seeker'}!
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(main)/jobseeker/profile')}>
            <View style={styles.profilePlaceholder}>
              <MaterialIcons name="person" size={30} color="#666" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#e8f4fd' }]}>
              <MaterialIcons name="work" size={24} color="#3498db" />
            </View>
            <Text style={styles.statNumber}>{stats.applications}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#eafaf1' }]}>
              <MaterialIcons name="event" size={24} color="#2ecc71" />
            </View>
            <Text style={styles.statNumber}>{stats.interviews}</Text>
            <Text style={styles.statLabel}>Interviews</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#f4ecf7' }]}>
              <MaterialIcons name="person" size={24} color="#9b59b6" />
            </View>
            <Text style={styles.statNumber}>{stats.profileStrength}%</Text>
            <Text style={styles.statLabel}>Profile Strength</Text>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionButton}
                onPress={action.onPress}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <MaterialIcons name={action.icon} size={24} color="white" />
                </View>
                <Text style={styles.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Recommended Jobs */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended Jobs</Text>
            <TouchableOpacity onPress={() => router.push('/(main)/jobseeker/jobs')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3498db" />
              <Text style={styles.loadingText}>Loading recommended jobs...</Text>
            </View>
          ) : recommendedJobs.length > 0 ? (
            recommendedJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                onPress={() => router.push({
                  pathname: '/(main)/jobseeker/job-details',
                  params: { jobId: job.id }
                })}
              >
                <View style={styles.jobInfo}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <Text style={styles.jobCompany}>{job.company}</Text>
                  <View style={styles.jobDetails}>
                    <View style={styles.jobDetail}>
                      <Ionicons name="location" size={14} color="#7f8c8d" />
                      <Text style={styles.jobDetailText}>{job.location}</Text>
                    </View>
                    <View style={styles.jobDetail}>
                      <FontAwesome5 name="money-bill-wave" size={12} color="#7f8c8d" />
                      <Text style={styles.jobDetailText}>{job.salary || 'Competitive'}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.jobMeta}>
                  <Text style={styles.jobPosted}>
                    {job.postedAt?.toDate ?
                      Math.floor((new Date() - job.postedAt.toDate()) / (1000 * 60 * 60 * 24)) + ' days ago'
                      : 'Recently'
                    }
                  </Text>
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={() => handleApply(job.id)}
                  >
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="work-off" size={48} color="#bdc3c7" />
              <Text style={styles.emptyText}>No jobs available</Text>
              <Text style={styles.emptySubtext}>Check back later for new opportunities</Text>
            </View>
          )}
        </Animated.View>

        {/* Posts Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Community Posts</Text>
          <TouchableOpacity onPress={() => router.push('/(main)/posts')}>
            <Text style={styles.seeAllText}>View All Posts</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  profilePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e1e8ed',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 15,
    marginHorizontal: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  seeAllText: {
    color: '#3498db',
    fontWeight: '500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    textAlign: 'center',
  },
  jobCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  jobCompany: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  jobDetails: {
    flexDirection: 'row',
    gap: 15,
  },
  jobDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobDetailText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  jobMeta: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  jobPosted: {
    fontSize: 12,
    color: '#95a5a6',
  },
  applyButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default JobSeekerDashboard;
