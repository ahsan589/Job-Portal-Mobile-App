// app/(main)/jobseeker/dashboard.js
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  RefreshControl,
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
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    applications: 0,
    interviews: 0,
    profileStrength: 0,
    savedJobs: 0
  });
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [profile, setProfile] = useState(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const headerScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  useEffect(() => {
    if (!loading) {
      animateIn();
    }
  }, [loading]);

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
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
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
          interviews: applications.filter(app => app.status === 'interview').length,
          savedJobs: applications.filter(app => app.saved).length || 0
        }));
      }

      // Load recommended jobs
      const jobsResult = await JobService.getJobs();
      if (jobsResult.success) {
        // Get first 4 jobs as recommended with more variety
        const shuffledJobs = [...jobsResult.data].sort(() => 0.5 - Math.random());
        setRecommendedJobs(shuffledJobs.slice(0, 4));
      }
    } catch (error) {
      console.error('Dashboard loading error:', error);
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

  const handleQuickApply = async (jobId) => {
    if (!user) return;

    Alert.alert(
      'Quick Apply',
      'Apply for this job with your profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply Now',
          onPress: async () => {
            const result = await JobService.applyForJob(user.uid, jobId, {
              coverLetter: 'I am excited to apply for this position and believe my skills are a great match for your requirements.'
            });

            if (result.success) {
              Alert.alert('Success', 'Application submitted successfully! 🎉');
              loadDashboardData();
            } else {
              Alert.alert('Error', result.error || 'Failed to submit application');
            }
          }
        }
      ]
    );
  };

  const quickActions = [
    {
      title: 'Find Jobs',
      icon: 'search',
      color: '#6366f1',
      gradient: ['#6366f1', '#4f46e5'],
      onPress: () => router.push('/(main)/jobseeker/jobs')
    },
    {
      title: 'Applications',
      icon: 'description',
      color: '#10b981',
      gradient: ['#10b981', '#059669'],
      onPress: () => router.push('/(main)/jobseeker/applications')
    },
    {
      title: 'Messages',
      icon: 'chat',
      color: '#f59e0b',
      gradient: ['#f59e0b', '#d97706'],
      onPress: () => router.push('/(main)/jobseeker/message')
    },
    {
      title: 'AI Assistant',
      icon: 'smart-toy',
      color: '#ec4899',
      gradient: ['#ec4899', '#db2777'],
      onPress: () => router.push('/(main)/jobseeker/chatbot')
    },
    {
      title: 'My Profile',
      icon: 'person',
      color: '#8b5cf6',
      gradient: ['#8b5cf6', '#7c3aed'],
      onPress: () => router.push('/(main)/jobseeker/profile')
    },
    {
      title: 'Resources',
      icon: 'menu-book',
      color: '#06b6d4',
      gradient: ['#06b6d4', '#0891b2'],
      onPress: () => router.push('/(main)/jobseeker/resources')
    }
  ];

  const StatCard = ({ icon, value, label, color, gradient }) => (
    <Animated.View 
      style={[
        styles.statCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={[styles.statGradient, { 
        backgroundColor: gradient ? gradient[0] : color,
        opacity: 0.1 
      }]} />
    </Animated.View>
  );

  const JobCard = ({ job, index }) => (
    <Animated.View
      style={[
        styles.jobCard,
        {
          opacity: fadeAnim,
          transform: [{
            translateX: slideAnim.interpolate({
              inputRange: [0, 50],
              outputRange: [0, -20 * index],
            })
          }]
        }
      ]}
    >
      <TouchableOpacity
        onPress={() => router.push({
          pathname: '/(main)/jobseeker/job-details',
          params: { jobId: job.id }
        })}
      >
        <View style={styles.jobHeader}>
          <View style={styles.jobBasicInfo}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <Text style={styles.jobCompany}>{job.company}</Text>
          </View>
          <View style={styles.jobTypeBadge}>
            <Text style={styles.jobTypeText}>{job.jobType}</Text>
          </View>
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.jobDetail}>
            <Ionicons name="location-outline" size={16} color="#64748b" />
            <Text style={styles.jobDetailText}>{job.location}</Text>
          </View>
          <View style={styles.jobDetail}>
            <FontAwesome5 name="money-bill-wave" size={14} color="#64748b" />
            <Text style={styles.jobDetailText}>{job.salary || 'Competitive Salary'}</Text>
          </View>
          <View style={styles.jobDetail}>
            <MaterialIcons name="access-time" size={16} color="#64748b" />
            <Text style={styles.jobDetailText}>
              {job.postedAt?.toDate ?
                Math.floor((new Date() - job.postedAt.toDate()) / (1000 * 60 * 60 * 24)) + 'd ago'
                : 'Recent'
              }
            </Text>
          </View>
        </View>

        <View style={styles.jobActions}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={() => {/* Add save functionality */}}
          >
            <Ionicons name="bookmark-outline" size={20} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => handleQuickApply(job.id)}
          >
            <Text style={styles.applyButtonText}>Quick Apply</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading && !refreshing) {
    return (
      <RoleGuard requiredRole="jobseeker">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Preparing your dashboard...</Text>
        </View>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="jobseeker">
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ scale: headerScale }]
            }
          ]}
        >
          <View style={styles.headerContent}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>
                {userData?.firstName || user?.email?.split('@')[0] || 'Job Seeker'}! 👋
              </Text>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/(main)/jobseeker/profile')}
            >
              {profile?.profileImage ? (
                <Image 
                  source={{ uri: profile.profileImage }} 
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <MaterialIcons name="person" size={24} color="#6366f1" />
                </View>
              )}
              <View style={styles.onlineIndicator} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View
          style={[
            styles.statsContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.statsGrid}>
            <StatCard
              icon="work"
              value={stats.applications}
              label="Applications"
              color="#6366f1"
              gradient={['#6366f1', '#4f46e5']}
            />
            <StatCard
              icon="event"
              value={stats.interviews}
              label="Interviews"
              color="#10b981"
              gradient={['#10b981', '#059669']}
            />
            <StatCard
              icon="person"
              value={`${stats.profileStrength}%`}
              label="Profile"
              color="#8b5cf6"
              gradient={['#8b5cf6', '#7c3aed']}
            />
            <StatCard
              icon="bookmark"
              value={stats.savedJobs}
              label="Saved"
              color="#f59e0b"
              gradient={['#f59e0b', '#d97706']}
            />
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
                <View style={[styles.actionIcon, {
                  backgroundColor: action.gradient ? action.gradient[0] : action.color
                }]}>
                  <MaterialIcons name={action.icon} size={24} color="white" />
                </View>
                <Text style={styles.actionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* AI Assistant Banner */}
        <Animated.View
          style={[
            styles.chatbotBanner,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.bannerContent}>
            <View style={styles.bannerIcon}>
              <MaterialIcons name="smart-toy" size={32} color="#ec4899" />
            </View>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>AI Career Assistant</Text>
              <Text style={styles.bannerSubtitle}>
                Get personalized job search help and interview tips
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.bannerButton}
              onPress={() => router.push('/(main)/jobseeker/chatbot')}
            >
              <Text style={styles.bannerButtonText}>Ask AI</Text>
            </TouchableOpacity>
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
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="star" size={24} color="#f59e0b" />
              <Text style={styles.sectionTitle}>Recommended For You</Text>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/(main)/jobseeker/jobs')}
            >
              <Text style={styles.seeAllText}>View All</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#6366f1" />
            </TouchableOpacity>
          </View>

          {recommendedJobs.length > 0 ? (
            recommendedJobs.map((job, index) => (
              <JobCard key={job.id} job={job} index={index} />
            ))
          ) : (
            <View style={styles.emptyJobs}>
              <MaterialIcons name="work-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyJobsTitle}>No jobs available</Text>
              <Text style={styles.emptyJobsText}>
                Check back later for new opportunities matching your profile
              </Text>
              <TouchableOpacity 
                style={styles.findJobsButton}
                onPress={() => router.push('/(main)/jobseeker/jobs')}
              >
                <Text style={styles.findJobsButtonText}>Browse All Jobs</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* Profile Completion */}
        {stats.profileStrength < 80 && (
          <Animated.View
            style={[
              styles.profileBanner,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.bannerContent}>
              <View style={styles.bannerIcon}>
                <MaterialIcons name="person" size={24} color="#6366f1" />
              </View>
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>Complete Your Profile</Text>
                <Text style={styles.bannerSubtitle}>
                  Increase your chances by completing your profile ({stats.profileStrength}%)
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.bannerButton}
                onPress={() => router.push('/(main)/jobseeker/profile')}
              >
                <Text style={styles.bannerButtonText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </RoleGuard>
  );
}

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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontFamily: 'System',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
    fontFamily: 'System',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    fontFamily: 'System',
  },
  dateText: {
    fontSize: 14,
    color: '#94a3b8',
    fontFamily: 'System',
  },
  profileButton: {
    position: 'relative',
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#f1f5f9',
  },
  profilePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#f1f5f9',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: 'white',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginTop: -40,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    fontFamily: 'System',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'System',
    fontWeight: '500',
  },
  statGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    fontFamily: 'System',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  seeAllText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    fontFamily: 'System',
  },
  chatbotBanner: {
    backgroundColor: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fbcfe8',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  jobCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobBasicInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    fontFamily: 'System',
  },
  jobCompany: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
    fontFamily: 'System',
  },
  jobTypeBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  jobTypeText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
    fontFamily: 'System',
  },
  jobDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  jobDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jobDetailText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'System',
  },
  jobActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  emptyJobs: {
    alignItems: 'center',
    padding: 40,
  },
  emptyJobsTitle: {
    fontSize: 20,
    color: '#1e293b',
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'System',
  },
  emptyJobsText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    fontFamily: 'System',
  },
  findJobsButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  findJobsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  profileBanner: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    fontFamily: 'System',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'System',
  },
  bannerButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bannerButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

export default JobSeekerDashboard;