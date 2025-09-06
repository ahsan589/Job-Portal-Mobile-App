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
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import RoleGuard from '../../../src/components/RoleGuard';
import { useAuth } from '../../../src/contexts/AuthContext';
import { JobService } from '../../../src/services/jobService';

const { width } = Dimensions.get('window');

const EmployerDashboard = () => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    jobPostings: 0,
    applications: 0,
    activeCandidates: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);

  // Define quickActions first
  const quickActions = [
    {
      title: 'Post a Job',
      icon: 'add-circle',
      color: '#3498db',
      onPress: () => router.push('/(main)/employer/post-job')
    },
    {
      title: 'Manage Jobs',
      icon: 'work',
      color: '#2ecc71',
      onPress: () => router.push('/(main)/employer/jobs')
    },
    {
      title: 'Candidates',
      icon: 'people',
      color: '#9b59b6',
      onPress: () => router.push('/(main)/employer/candidates')
    },
    {
      title: 'Company Profile',
      icon: 'business',
      color: '#e67e22',
      onPress: () => router.push('/(main)/employer/profile')
    }
  ];

  // Animation values
  const messageButtonScale = useRef(new Animated.Value(1)).current;
  const actionButtonScales = useRef(quickActions.map(() => new Animated.Value(1))).current;
  const applicationCardScales = useRef(new Animated.Value(1)).current;
  const interviewCardScales = useRef(new Animated.Value(1)).current;
  const analyticsButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load employer jobs
      const jobsResult = await JobService.getEmployerJobs(user.uid);
      if (jobsResult.success) {
        const jobs = jobsResult.data || [];
        setStats(prev => ({
          ...prev,
          jobPostings: jobs.length
        }));

        // Calculate total applications across all jobs
        let totalApplications = 0;
        let activeCandidates = 0;

        for (const job of jobs) {
          if (job.applications) {
            totalApplications += job.applications.length;
            activeCandidates += job.applications.filter(app => app.status === 'pending' || app.status === 'reviewed').length;
          }
        }

        setStats(prev => ({
          ...prev,
          applications: totalApplications,
          activeCandidates: activeCandidates
        }));

        // Get recent applications (last 3)
        const allApplications = jobs.flatMap(job =>
          (job.applications || []).map(app => ({
            ...app,
            jobTitle: job.title,
            jobId: job.id
          }))
        ).sort((a, b) => (b.appliedAt?.toDate?.() || new Date()) - (a.appliedAt?.toDate?.() || new Date()));

        setRecentApplications(allApplications.slice(0, 3).map(app => ({
          id: app.id,
          name: app.applicantName || 'Anonymous',
          position: app.jobTitle,
          status: app.status || 'New',
          date: app.appliedAt?.toDate ?
            Math.floor((new Date() - app.appliedAt.toDate()) / (1000 * 60 * 60)) + ' hours ago' :
            'Recently',
          image: require('../../../assets/images/logo.png')
        })));

        // Get upcoming interviews
        const interviews = allApplications.filter(app => app.status === 'interview');
        setUpcomingInterviews(interviews.slice(0, 2).map(app => ({
          id: app.id,
          candidate: app.applicantName || 'Anonymous',
          position: app.jobTitle,
          time: app.interviewDate || 'TBD',
          type: app.interviewType || 'Video Call'
        })));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <RoleGuard requiredRole="employer">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="employer">
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back to</Text>
            <Text style={styles.companyName}>
              {userData?.companyName || 'Your Company'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(main)/employer/profile')}>
            <Image
              source={userData?.companyLogo ? { uri: userData.companyLogo } : require('../../../assets/images/logo.png')}
              style={styles.companyLogo}
            />
          </TouchableOpacity>
        </View>

        {/* Quick message button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => router.push('/(main)/messages')}
          >
            <MaterialIcons name="chat" size={24} color="white" />
            <Text style={styles.messageButtonText}>Messages</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#e8f4fd' }]}>
              <MaterialIcons name="work" size={24} color="#3498db" />
            </View>
            <Text style={styles.statNumber}>{stats.jobPostings}</Text>
            <Text style={styles.statLabel}>Job Postings</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#eafaf1' }]}>
              <MaterialIcons name="description" size={24} color="#2ecc71" />
            </View>
            <Text style={styles.statNumber}>{stats.applications}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#f4ecf7' }]}>
              <MaterialIcons name="people" size={24} color="#9b59b6" />
            </View>
            <Text style={styles.statNumber}>{stats.activeCandidates}</Text>
            <Text style={styles.statLabel}>Active Candidates</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
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
        </View>

        {/* Recent Applications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Applications</Text>
            <TouchableOpacity onPress={() => router.push('/(main)/employer/candidates')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentApplications.map((application) => (
            <TouchableOpacity key={application.id} style={styles.applicationCard}>
              <Image source={application.image} style={styles.candidateImage} />
              <View style={styles.applicationInfo}>
                <Text style={styles.candidateName}>{application.name}</Text>
                <Text style={styles.candidatePosition}>{application.position}</Text>
                <Text style={styles.applicationDate}>{application.date}</Text>
              </View>
              <View style={[styles.statusBadge,
                application.status === 'New' && styles.statusNew,
                application.status === 'Reviewed' && styles.statusReviewed,
                application.status === 'Interview' && styles.statusInterview
              ]}>
                <Text style={styles.statusText}>{application.status}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Interviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Interviews</Text>
          </View>

          {upcomingInterviews.map((interview) => (
            <View key={interview.id} style={styles.interviewCard}>
              <View style={styles.interviewInfo}>
                <Text style={styles.interviewCandidate}>{interview.candidate}</Text>
                <Text style={styles.interviewPosition}>{interview.position}</Text>
                <View style={styles.interviewDetails}>
                  <View style={styles.interviewDetail}>
                    <MaterialIcons name="access-time" size={16} color="#7f8c8d" />
                    <Text style={styles.interviewDetailText}>{interview.time}</Text>
                  </View>
                  <View style={styles.interviewDetail}>
                    <MaterialIcons name="videocam" size={16} color="#7f8c8d" />
                    <Text style={styles.interviewDetailText}>{interview.type}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.interviewActions}>
                <TouchableOpacity style={styles.interviewActionButton}>
                  <MaterialIcons name="chat" size={20} color="#3498db" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.interviewActionButton}>
                  <MaterialIcons name="calendar-today" size={20} color="#3498db" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Analytics Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Analytics</Text>
          <View style={styles.analyticsCard}>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>42%</Text>
              <Text style={styles.analyticsLabel}>Application Rate</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>18%</Text>
              <Text style={styles.analyticsLabel}>Interview Rate</Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={styles.analyticsValue}>7 days</Text>
              <Text style={styles.analyticsLabel}>Avg. Hiring Time</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.analyticsButton}>
            <Text style={styles.analyticsButtonText}>View Detailed Analytics</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#3498db" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  companyLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'white',
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
    marginTop: 10,
    padding: 20,
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
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  applicationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    borderRadius: 10,
    marginBottom: 10,
  },
  candidateImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  applicationInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  candidatePosition: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  applicationDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusNew: {
    backgroundColor: '#e8f4fd',
  },
  statusReviewed: {
    backgroundColor: '#eafaf1',
  },
  statusInterview: {
    backgroundColor: '#fff4e6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  interviewCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  interviewInfo: {
    flex: 1,
  },
  interviewCandidate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  interviewPosition: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  interviewDetails: {
    flexDirection: 'row',
    gap: 15,
  },
  interviewDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  interviewDetailText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  interviewActions: {
    flexDirection: 'row',
    gap: 10,
  },
  interviewActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginBottom: 15,
  },
  analyticsItem: {
    alignItems: 'center',
    flex: 1,
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 8,
  },
  analyticsButtonText: {
    color: '#3498db',
    fontWeight: '500',
    marginRight: 5,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  messageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default EmployerDashboard;
