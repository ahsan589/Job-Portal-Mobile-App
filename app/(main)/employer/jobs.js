// app/(main)/employer/jobs.js
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
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

const EmployerJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (user) {
      loadJobs();
    }
  }, [user]);

  useFocusReload(() => {
    if (user) {
      loadJobs();
    }
  }, [user]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadJobs = async () => {
    if (!user) {
      console.log('No user found for employer jobs');
      return;
    }

    console.log('Loading jobs for employer:', user.uid);
    setLoading(true);

    try {
      const result = await JobService.getEmployerJobs(user.uid);
      console.log('Employer jobs result:', result);

      setLoading(false);

      if (result.success) {
        console.log('Jobs loaded:', result.data.length);
        setJobs(result.data);
      } else {
        console.error('Error loading employer jobs:', result.error);
        Alert.alert('Error', result.error || 'Failed to load your jobs');
      }
    } catch (error) {
      console.error('Exception loading employer jobs:', error);
      setLoading(false);
      Alert.alert('Error', 'An unexpected error occurred while loading jobs');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const handleDeleteJob = async (jobId, jobTitle) => {
    console.log('Delete job initiated:', { jobId, jobTitle });

    Alert.alert(
      'Delete Job Post',
      `Are you sure you want to delete "${jobTitle}"? This action cannot be undone and all applications will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Calling JobService.deleteJob with jobId:', jobId);
              const result = await JobService.deleteJob(jobId);
              console.log('Delete job result:', result);

              if (result.success) {
                console.log('Job deleted successfully, updating local state');
                setJobs(prev => {
                  const filtered = prev.filter(job => job.id !== jobId);
                  console.log('Jobs after deletion:', filtered.length);
                  return filtered;
                });
                Alert.alert('Success', 'Job posting deleted successfully');
              } else {
                console.error('Delete job failed:', result.error);
                Alert.alert('Error', `Failed to delete job: ${result.error}`);
              }
            } catch (error) {
              console.error('Exception during delete:', error);
              Alert.alert('Error', `An unexpected error occurred: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const handleEditJob = (jobId) => {
    router.push({
      pathname: '/(main)/employer/edit-job',
      params: { jobId }
    });
  };

  const handleViewApplications = (jobId) => {
    router.push({
      pathname: '/(main)/employer/candidates',
      params: { jobId }
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      active: { 
        color: '#10b981', 
        bg: '#d1fae5', 
        icon: 'rocket-launch',
        label: 'ACTIVE'
      },
      paused: { 
        color: '#f59e0b', 
        bg: '#fef3c7', 
        icon: 'pause-circle',
        label: 'PAUSED'
      },
      closed: { 
        color: '#ef4444', 
        bg: '#fee2e2', 
        icon: 'lock',
        label: 'CLOSED'
      },
      draft: { 
        color: '#6b7280', 
        bg: '#f3f4f6', 
        icon: 'drafts',
        label: 'DRAFT'
      }
    };
    return configs[status] || configs.active;
  };

  const renderJobCard = ({ item, index }) => {
    const statusConfig = getStatusConfig(item.status);
    const daysAgo = item.postedAt?.toDate ? 
      Math.floor((new Date() - item.postedAt.toDate()) / (1000 * 60 * 60 * 24)) : 0;

    return (
      <Animated.View 
        style={[
          styles.jobCard,
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

        {/* Job Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobInfo}>
            <Text style={styles.jobTitle}>{item.title}</Text>
            <View style={styles.locationContainer}>
              <MaterialIcons name="location-on" size={16} color="#6b7280" />
              <Text style={styles.jobLocation}>{item.location}</Text>
            </View>
          </View>
        </View>

        {/* Job Stats */}
        <View style={styles.jobStats}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
              <MaterialIcons name="people" size={16} color="#3b82f6" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>{item.applicationsCount || 0}</Text>
              <Text style={styles.statLabel}>Applications</Text>
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
              <FontAwesome5 name="eye" size={14} color="#16a34a" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>{item.views || 0}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
              <MaterialIcons name="access-time" size={16} color="#d97706" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={styles.statValue}>{daysAgo}</Text>
              <Text style={styles.statLabel}>Days Ago</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.jobDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Action Buttons */}
        <View style={styles.jobActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.applicationButton]}
            onPress={() => handleViewApplications(item.id)}
          >
            <MaterialIcons name="people-alt" size={18} color="#3b82f6" />
            <Text style={[styles.actionText, { color: '#3b82f6' }]}>View Apps</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditJob(item.id)}
          >
            <MaterialIcons name="edit" size={18} color="#f59e0b" />
            <Text style={[styles.actionText, { color: '#f59e0b' }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteJob(item.id, item.title)}
          >
            <MaterialIcons name="delete-outline" size={18} color="#ef4444" />
            <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
          </TouchableOpacity>
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
            <Text style={styles.headerTitle}>My Job Postings</Text>
            <Text style={styles.headerSubtitle}>
              {jobs.length} {jobs.length === 1 ? 'active posting' : 'active postings'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.postJobButton}
            onPress={() => router.push('/(main)/employer/post-job')}
          >
            <Ionicons name="add" size={22} color="white" />
            <Text style={styles.postJobText}>Post Job</Text>
          </TouchableOpacity>
        </View>

        {/* Jobs List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSpinner} />
            <Text style={styles.loadingText}>Loading your job postings...</Text>
          </View>
        ) : (
          <FlatList
            data={jobs}
            renderItem={renderJobCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.jobsList}
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
                  <MaterialIcons name="work-outline" size={80} color="#d1d5db" />
                </View>
                <Text style={styles.emptyTitle}>No job postings yet</Text>
                <Text style={styles.emptySubtext}>
                  Start creating job postings to attract talented candidates to your company
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/(main)/employer/post-job')}
                >
                  <Ionicons name="add-circle" size={20} color="white" />
                  <Text style={styles.emptyButtonText}>Create First Job Post</Text>
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
    alignItems: 'center',
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
  postJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 6,
  },
  postJobText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  jobsList: {
    padding: 16,
    paddingBottom: 20,
  },
  jobCard: {
    backgroundColor: 'white',
    padding: 24,
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
  jobHeader: {
    marginBottom: 20,
    marginRight: 100,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 24,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobLocation: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  jobStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  jobDescription: {
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  jobActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    flex: 1,
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  applicationButton: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
  },
  editButton: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fee2e2',
  },
  actionText: {
    fontSize: 13,
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
    paddingHorizontal: 24,
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

export default EmployerJobs;