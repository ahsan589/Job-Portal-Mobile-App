// app/(main)/employer/dashboard.js
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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
import { messageService } from '../../../src/services/messageService';

const { width } = Dimensions.get('window');

const EmployerDashboard = () => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    jobPostings: 0,
    applications: 0,
    activeCandidates: 0,
    interviewScheduled: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!loading) {
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
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [loading]);

  const quickActions = [
    {
      title: 'Post a Job',
      icon: 'add-circle',
      color: '#6366f1',
      gradient: ['#6366f1', '#4f46e5'],
      onPress: () => router.push('/(main)/employer/post-job')
    },
    {
      title: 'Manage Jobs',
      icon: 'work',
      color: '#10b981',
      gradient: ['#10b981', '#059669'],
      onPress: () => router.push('/(main)/employer/jobs')
    },
    {
      title: 'Candidates',
      icon: 'people',
      color: '#8b5cf6',
      gradient: ['#8b5cf6', '#7c3aed'],
      onPress: () => router.push('/(main)/employer/candidates')
    },
    {
      title: 'Messages',
      icon: 'chat',
      color: '#f59e0b',
      gradient: ['#f59e0b', '#d97706'],
      onPress: () => router.push('/(main)/employer/message')
    }
  ];

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const jobsResult = await JobService.getEmployerJobs(user.uid);
      if (jobsResult.success) {
        const jobs = jobsResult.data || [];
        const allApplications = jobs.flatMap(job =>
          (job.applications || []).map(app => ({
            ...app,
            jobTitle: job.title,
            jobId: job.id
          }))
        ).sort((a, b) => (b.appliedAt?.toDate?.() || new Date()) - (a.appliedAt?.toDate?.() || new Date()));

        const interviews = allApplications.filter(app => app.status === 'interview');
        
        setStats({
          jobPostings: jobs.length,
          applications: allApplications.length,
          activeCandidates: allApplications.filter(app => app.status === 'pending' || app.status === 'reviewed').length,
          interviewScheduled: interviews.length
        });

        setRecentApplications(allApplications.slice(0, 3).map(app => ({
          id: app.id,
          applicantId: app.applicantId || app.userId,
          name: app.applicantName || 'Anonymous',
          position: app.jobTitle,
          status: app.status || 'New',
          date: app.appliedAt?.toDate ?
            Math.floor((new Date() - app.appliedAt.toDate()) / (1000 * 60 * 60)) + ' hours ago' :
            'Recently',
          image: require('../../../assets/images/logo.png')
        })));

        setUpcomingInterviews(interviews.slice(0, 2).map(app => ({
          id: app.id,
          applicantId: app.applicantId || app.userId,
          candidate: app.applicantName || 'Anonymous',
          position: app.jobTitle,
          time: app.interviewDate || 'TBD',
          type: app.interviewType || 'Video Call',
          date: app.interviewDate || new Date()
        })));
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageCandidate = async (applicantId, applicantName) => {
    if (!user || !applicantId) return;

    try {
      const result = await messageService.createConversation(user.uid, applicantId);
      if (result.success) {
        router.push({
          pathname: '/(main)/employer/message',
          params: { conversationId: result.id }
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    }
  };

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

  if (loading) {
    return (
      <RoleGuard requiredRole="employer">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="employer">
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
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.companyName}>
                {userData?.companyName || 'Your Company'}
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
              onPress={() => router.push('/(main)/employer/profile')}
            >
              <Image
                source={userData?.companyLogo ? { uri: userData.companyLogo } : require('../../../assets/images/logo.png')}
                style={styles.companyLogo}
              />
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
              value={stats.jobPostings}
              label="Active Jobs"
              color="#6366f1"
              gradient={['#6366f1', '#4f46e5']}
            />
            <StatCard
              icon="description"
              value={stats.applications}
              label="Applications"
              color="#10b981"
              gradient={['#10b981', '#059669']}
            />
            <StatCard
              icon="people"
              value={stats.activeCandidates}
              label="Candidates"
              color="#8b5cf6"
              gradient={['#8b5cf6', '#7c3aed']}
            />
            <StatCard
              icon="event"
              value={stats.interviewScheduled}
              label="Interviews"
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

        {/* Recent Applications */}
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
              <MaterialIcons name="description" size={24} color="#6366f1" />
              <Text style={styles.sectionTitle}>Recent Applications</Text>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/(main)/employer/candidates')}
            >
              <Text style={styles.seeAllText}>View All</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#6366f1" />
            </TouchableOpacity>
          </View>

          {recentApplications.length > 0 ? (
            recentApplications.map((application, index) => (
              <Animated.View
                key={application.id}
                style={[
                  styles.applicationCard,
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
                <View style={styles.applicationContent}>
                  <Image source={application.image} style={styles.candidateImage} />
                  <View style={styles.applicationInfo}>
                    <Text style={styles.candidateName}>{application.name}</Text>
                    <Text style={styles.candidatePosition}>{application.position}</Text>
                    <View style={styles.applicationMeta}>
                      <MaterialIcons name="access-time" size={12} color="#94a3b8" />
                      <Text style={styles.applicationDate}>{application.date}</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    application.status === 'New' && styles.statusNew,
                    application.status === 'Reviewed' && styles.statusReviewed,
                    application.status === 'Interview' && styles.statusInterview
                  ]}>
                    <Text style={styles.statusText}>{application.status}</Text>
                  </View>
                </View>
                <View style={styles.applicationActions}>
                  <TouchableOpacity 
                    style={styles.applicationActionButton}
                    onPress={() => router.push({
                      pathname: '/(main)/employer/application-details',
                      params: { applicationId: application.id }
                    })}
                  >
                    <Text style={styles.applicationActionText}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.applicationActionButton}
                    onPress={() => handleMessageCandidate(application.applicantId, application.name)}
                  >
                    <MaterialIcons name="chat" size={16} color="#6366f1" />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="description" size={48} color="#cbd5e1" />
              <Text style={styles.emptyStateText}>No applications yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Applications will appear here when candidates apply to your jobs
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Upcoming Interviews */}
        {upcomingInterviews.length > 0 && (
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
                <MaterialIcons name="event" size={24} color="#f59e0b" />
                <Text style={styles.sectionTitle}>Upcoming Interviews</Text>
              </View>
            </View>

            {upcomingInterviews.map((interview) => (
              <View key={interview.id} style={styles.interviewCard}>
                <View style={styles.interviewContent}>
                  <View style={styles.interviewIcon}>
                    <MaterialIcons name="videocam" size={24} color="#f59e0b" />
                  </View>
                  <View style={styles.interviewInfo}>
                    <Text style={styles.interviewCandidate}>{interview.candidate}</Text>
                    <Text style={styles.interviewPosition}>{interview.position}</Text>
                    <View style={styles.interviewDetails}>
                      <View style={styles.interviewDetail}>
                        <MaterialIcons name="access-time" size={14} color="#64748b" />
                        <Text style={styles.interviewDetailText}>{interview.time}</Text>
                      </View>
                      <View style={styles.interviewDetail}>
                        <MaterialIcons name="video-call" size={14} color="#64748b" />
                        <Text style={styles.interviewDetailText}>{interview.type}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.interviewActions}>
                  <TouchableOpacity 
                    style={styles.interviewActionButton}
                    onPress={() => handleMessageCandidate(interview.applicantId, interview.candidate)}
                  >
                    <MaterialIcons name="chat" size={20} color="#6366f1" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.interviewActionButton}>
                    <MaterialIcons name="calendar-today" size={20} color="#10b981" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Performance Metrics */}
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
              <MaterialIcons name="analytics" size={24} color="#10b981" />
              <Text style={styles.sectionTitle}>Performance Overview</Text>
            </View>
          </View>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {stats.jobPostings > 0 ? Math.round((stats.applications / stats.jobPostings) * 100) : 0}%
              </Text>
              <Text style={styles.metricLabel}>Application Rate</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {stats.applications > 0 ? Math.round((upcomingInterviews.length / stats.applications) * 100) : 0}%
              </Text>
              <Text style={styles.metricLabel}>Interview Rate</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>7d</Text>
              <Text style={styles.metricLabel}>Avg. Response</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
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
  welcomeText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
    fontFamily: 'System',
    fontWeight: '500',
  },
  companyName: {
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
  companyLogo: {
    width: 56,
    height: 56,
    borderRadius: 16,
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
  applicationCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  applicationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  candidateImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  applicationInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
    fontFamily: 'System',
  },
  candidatePosition: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 6,
    fontFamily: 'System',
  },
  applicationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  applicationDate: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'System',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusNew: {
    backgroundColor: '#e0e7ff',
  },
  statusReviewed: {
    backgroundColor: '#d1fae5',
  },
  statusInterview: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  applicationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applicationActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  applicationActionText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  interviewCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  interviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  interviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  interviewInfo: {
    flex: 1,
  },
  interviewCandidate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
    fontFamily: 'System',
  },
  interviewPosition: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    fontFamily: 'System',
  },
  interviewDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  interviewDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  interviewDetailText: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'System',
  },
  interviewActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  interviewActionButton: {
    width: 40,
    height: 40,
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
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    fontFamily: 'System',
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'System',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#475569',
    fontWeight: '600',
    marginTop: 16,
    fontFamily: 'System',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontFamily: 'System',
  },
});

export default EmployerDashboard;