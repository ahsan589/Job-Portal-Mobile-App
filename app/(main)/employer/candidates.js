import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import RoleGuard from '../../../src/components/RoleGuard';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useFocusReload } from '../../../src/hooks/useFocusReload';
import { JobService } from '../../../src/services/jobService';

const { width } = Dimensions.get('window');

const EmployerCandidates = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    reviewed: 0,
    notReviewed: 0
  });
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (user) {
      loadCandidates();
    }
  }, [user]);

  useFocusReload(() => {
    if (user) {
      loadCandidates();
    }
  }, [user]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadCandidates = async () => {
    if (!user) {
      console.log('No user found for candidates');
      return;
    }

    console.log('Loading candidates for employer:', user.uid);
    setLoading(true);

    try {
      const jobsResult = await JobService.getEmployerJobs(user.uid);
      console.log('Employer jobs result:', jobsResult);

      if (!jobsResult.success) {
        console.error('Error loading employer jobs:', jobsResult.error);
        Alert.alert('Error', jobsResult.error || 'Failed to load your jobs');
        setLoading(false);
        return;
      }

      console.log('Found jobs:', jobsResult.data.length);

      const allApplications = [];
      for (const job of jobsResult.data) {
        console.log('Loading applications for job:', job.id, job.title);
        const appsResult = await JobService.getJobApplications(job.id);
        console.log('Applications for job', job.id, ':', appsResult);

        if (appsResult.success) {
          const appsWithJobInfo = appsResult.data.map(app => ({
            ...app,
            jobTitle: job.title,
            companyName: job.company || 'Your Company',
            jobLocation: job.location,
            salary: job.salary
          }));
          allApplications.push(...appsWithJobInfo);
        } else {
          console.error('Error loading applications for job', job.id, ':', appsResult.error);
        }
      }

      console.log('Total applications loaded:', allApplications.length);
      setApplications(allApplications);
      calculateStats(allApplications);
      setLoading(false);
    } catch (error) {
      console.error('Exception loading candidates:', error);
      setLoading(false);
      Alert.alert('Error', 'An unexpected error occurred while loading candidates');
    }
  };

  const calculateStats = (apps) => {
    const reviewed = apps.filter(app => app.status === 'reviewed').length;
    const notReviewed = apps.filter(app => app.status !== 'reviewed').length;
    
    const stats = {
      total: apps.length,
      reviewed: reviewed,
      notReviewed: notReviewed
    };
    setStats(stats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCandidates();
    setRefreshing(false);
  };

  const getStatusConfig = (status) => {
    if (status === 'reviewed') {
      return { 
        color: '#10b981', 
        bg: '#d1fae5', 
        icon: 'check-circle',
        label: 'REVIEWED'
      };
    } else {
      return { 
        color: '#f59e0b', 
        bg: '#fef3c7', 
        icon: 'schedule',
        label: 'NOT REVIEWED'
      };
    }
  };

  const handleMarkAsReviewed = (applicationId, applicantName) => {
    Alert.alert(
      'Mark as Reviewed',
      `Mark ${applicantName}'s application as reviewed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Reviewed',
          onPress: () => updateApplicationStatus(applicationId, 'reviewed')
        }
      ]
    );
  };

  const handleMarkAsNotReviewed = (applicationId, applicantName) => {
    Alert.alert(
      'Mark as Not Reviewed',
      `Mark ${applicantName}'s application as not reviewed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Not Reviewed',
          onPress: () => updateApplicationStatus(applicationId, 'pending')
        }
      ]
    );
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      // Implement your status update logic here
      console.log(`Updating application ${applicationId} to ${newStatus}`);
      // After successful update, reload applications
      await loadCandidates();
      Alert.alert('Success', `Application marked as ${newStatus === 'reviewed' ? 'reviewed' : 'not reviewed'}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update application status');
    }
  };

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>Application Overview</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#3b82f6' }]}>
            <MaterialIcons name="people" size={20} color="white" />
          </View>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#10b981' }]}>
            <MaterialIcons name="check-circle" size={20} color="white" />
          </View>
          <Text style={styles.statNumber}>{stats.reviewed}</Text>
          <Text style={styles.statLabel}>Reviewed</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#f59e0b' }]}>
            <MaterialIcons name="schedule" size={20} color="white" />
          </View>
          <Text style={styles.statNumber}>{stats.notReviewed}</Text>
          <Text style={styles.statLabel}>Not Reviewed</Text>
        </View>
      </View>
    </View>
  );

  const renderCandidateCard = ({ item, index }) => {
    const statusConfig = getStatusConfig(item.status);
    const appliedDate = item.appliedAt?.toDate ? 
      item.appliedAt.toDate().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }) : 'Recently';

    const isReviewed = item.status === 'reviewed';

    return (
      <Animated.View 
        style={[
          styles.candidateCard,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50 * (index + 1), 0],
              }),
            }],
          },
        ]}
      >
        {/* Status Ribbon */}
        <View style={[styles.statusRibbon, { backgroundColor: statusConfig.bg }]}>
          <MaterialIcons name={statusConfig.icon} size={14} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>

        {/* Candidate Header */}
        <View style={styles.candidateHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.applicantName ? item.applicantName.charAt(0).toUpperCase() : 'C'}
            </Text>
          </View>
          <View style={styles.candidateInfo}>
            <Text style={styles.candidateName}>{item.applicantName || 'Candidate'}</Text>
            <Text style={styles.candidateEmail}>{item.applicantEmail || 'No email provided'}</Text>
          </View>
        </View>

        {/* Job Info */}
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{item.jobTitle}</Text>
          <View style={styles.jobMeta}>
            <View style={styles.metaItem}>
              <MaterialIcons name="location-on" size={14} color="#6b7280" />
              <Text style={styles.metaText}>{item.jobLocation || 'Remote'}</Text>
            </View>
            {item.salary && (
              <View style={styles.metaItem}>
                <FontAwesome5 name="money-bill-wave" size={12} color="#6b7280" />
                <Text style={styles.metaText}>{item.salary}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Application Details */}
        <View style={styles.applicationDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="access-time" size={16} color="#6b7280" />
            <Text style={styles.detailText}>Applied {appliedDate}</Text>
          </View>
          
          {item.resumeUrl && (
            <TouchableOpacity 
              style={styles.resumeButton}
              onPress={() => Alert.alert('Resume', `Open: ${item.resumeUrl}`)}
            >
              <MaterialIcons name="description" size={16} color="#3b82f6" />
              <Text style={styles.resumeText}>View Resume</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => router.push({
              pathname: '/(main)/employer/application-details',
              params: { applicationId: item.id }
            })}
          >
            <MaterialIcons name="visibility" size={16} color="#3b82f6" />
            <Text style={[styles.actionText, { color: '#3b82f6' }]}>View Details</Text>
          </TouchableOpacity>

          {isReviewed ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.notReviewedButton]}
              onPress={() => handleMarkAsNotReviewed(item.id, item.applicantName)}
            >
              <MaterialIcons name="undo" size={16} color="#f59e0b" />
              <Text style={[styles.actionText, { color: '#f59e0b' }]}>Mark Not Reviewed</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.reviewedButton]}
              onPress={() => handleMarkAsReviewed(item.id, item.applicantName)}
            >
              <MaterialIcons name="check-circle" size={16} color="#10b981" />
              <Text style={[styles.actionText, { color: '#10b981' }]}>Mark Reviewed</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <RoleGuard requiredRole="employer">
      <View style={styles.container} collapsable={false}>
        {/* Enhanced Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Candidate Applications</Text>
            <Text style={styles.headerSubtitle}>
              Review and manage candidate applications
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => Alert.alert('Filter', 'Filter by review status')}
          >
            <MaterialIcons name="filter-list" size={22} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Statistics Card */}
        {!loading && applications.length > 0 && renderStatsCard()}

        {/* Candidates List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinner} />
            <Text style={styles.loadingText}>Loading applications...</Text>
          </View>
        ) : (
          <FlatList
            data={applications}
            renderItem={renderCandidateCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.candidatesList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#3b82f6']}
                tintColor="#3b82f6"
              />
            }
            ListEmptyComponent={
              <Animated.View 
                style={[
                  styles.emptyContainer,
                  { opacity: fadeAnim }
                ]}
              >
                <View style={styles.emptyIconContainer}>
                  <MaterialIcons name="people-outline" size={80} color="#d1d5db" />
                </View>
                <Text style={styles.emptyTitle}>No applications yet</Text>
                <Text style={styles.emptySubtext}>
                  Applications from candidates will appear here once they start applying to your job postings
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/(main)/employer/jobs')}
                >
                  <MaterialIcons name="work-outline" size={18} color="white" />
                  <Text style={styles.emptyButtonText}>View Job Postings</Text>
                </TouchableOpacity>
              </Animated.View>
            }
          />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    fontWeight: '500',
  },
  filterButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
  },
  statsContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
  },
  candidatesList: {
    padding: 16,
    paddingBottom: 20,
  },
  candidateCard: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    position: 'relative',
    overflow: 'hidden',
  },
  statusRibbon: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  candidateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginRight: 80,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  candidateEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  jobInfo: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  jobMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  applicationDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  resumeText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    flex: 1,
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  viewButton: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
  },
  reviewedButton: {
    backgroundColor: '#d1fae5',
    borderColor: '#a7f3d0',
  },
  notReviewedButton: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    gap: 16,
  },
  loadingSpinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#e5e7eb',
    borderTopColor: '#3b82f6',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 48,
    marginTop: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 22,
    color: '#374151',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default EmployerCandidates;