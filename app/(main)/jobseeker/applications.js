// app/(main)/jobseeker/applications.js
import { MaterialIcons } from '@expo/vector-icons';
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

const JobSeekerApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  useFocusReload(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadApplications = async () => {
    if (!user) {
      console.log('No user found for applications');
      return;
    }

    console.log('Loading applications for user:', user.uid);
    setLoading(true);

    try {
      const result = await JobService.getUserApplications(user.uid);
      console.log('Applications result:', result);

      setLoading(false);

      if (result.success) {
        console.log('Applications loaded:', result.data.length);
        setApplications(result.data);
      } else {
        console.error('Error loading applications:', result.error);
        Alert.alert('Error', result.error || 'Failed to load applications');
      }
    } catch (error) {
      console.error('Exception loading applications:', error);
      setLoading(false);
      Alert.alert('Error', 'An unexpected error occurred while loading applications');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadApplications();
    setRefreshing(false);
  };

  const getApplicationStatus = (application) => {
    const status = application.status;
    const colors = {
      pending: { bg: '#FFF3CD', text: '#856404', icon: 'schedule', label: 'Under Review' },
      reviewed: { bg: '#CCE5FF', text: '#004085', icon: 'visibility', label: 'Being Reviewed' },
      accepted: { bg: '#D4EDDA', text: '#155724', icon: 'check-circle', label: 'Accepted' },
      rejected: { bg: '#F8D7DA', text: '#721C24', icon: 'cancel', label: 'Not Selected' }
    };
    
    return colors[status] || colors.pending;
  };

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

  const renderApplicationCard = ({ item, index }) => {
    const status = getApplicationStatus(item);
    const cardStyle = {
      ...styles.applicationCard,
      opacity: fadeAnim,
      transform: [{
        translateY: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        })
      }]
    };

    return (
      <Animated.View style={cardStyle}>
        {/* Status Ribbon */}
        <View style={[styles.statusRibbon, { backgroundColor: status.bg }]}>
          <MaterialIcons name={status.icon} size={14} color={status.text} />
          <Text style={[styles.statusText, { color: status.text }]}>
            {status.label}
          </Text>
        </View>

        {/* Main Content */}
        <View style={styles.cardContent}>
          <View style={styles.jobHeader}>
            <View style={styles.jobInfo}>
              <Text style={styles.jobTitle} numberOfLines={2}>
                {item.jobTitle || 'Untitled Position'}
              </Text>
              <Text style={styles.companyName} numberOfLines={1}>
                {item.companyName || 'Unknown Company'}
              </Text>
            </View>
            <View style={styles.applicationMeta}>
              <View style={styles.metaItem}>
                <MaterialIcons name="access-time" size={14} color="#6c757d" />
                <Text style={styles.metaText}>
                  {getTimeAgo(item.appliedAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Cover Letter Preview */}
          {item.coverLetter && (
            <View style={styles.coverLetterSection}>
              <Text style={styles.sectionLabel}>Cover Letter</Text>
              <Text style={styles.coverLetterText} numberOfLines={3}>
                {item.coverLetter}
              </Text>
            </View>
          )}

          {/* Skills/Tags Section */}
          <View style={styles.tagsContainer}>
            {item.skills?.slice(0, 3).map((skill, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{skill}</Text>
              </View>
            ))}
            {item.skills?.length > 3 && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>+{item.skills.length - 3} more</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.primaryAction]}
              onPress={() => router.push({
                pathname: '/(main)/jobseeker/job-details',
                params: { jobId: item.jobId }
              })}
            >
              <MaterialIcons name="visibility" size={16} color="white" />
              <Text style={styles.primaryActionText}>View Job</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryAction]}
              onPress={() => {
                if (item.resumeUrl) {
                  window.open(item.resumeUrl, '_blank');
                } else {
                  Alert.alert('No Resume', 'No resume available for download');
                }
              }}
            >
              <MaterialIcons 
                name={item.resumeUrl ? "file-download" : "file-present"} 
                size={16} 
                color="#3498db" 
              />
              <Text style={styles.secondaryActionText}>
                {item.resumeUrl ? 'Resume' : 'No Resume'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.dangerAction]}
              onPress={() => showWithdrawConfirmation(item)}
            >
              <MaterialIcons name="delete-outline" size={16} color="#e74c3c" />
              <Text style={styles.dangerActionText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  const showWithdrawConfirmation = (application) => {
    Alert.alert(
      'Withdraw Application',
      `Are you sure you want to withdraw your application for "${application.jobTitle}" at ${application.companyName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Withdraw', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const result = await JobService.withdrawApplication(application.id, application.jobId);
              if (result.success) {
                Alert.alert('Success', 'Application withdrawn successfully');
                loadApplications();
              } else {
                Alert.alert('Error', result.error || 'Failed to withdraw application');
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred');
            }
          }
        }
      ]
    );
  };

  return (
    <RoleGuard requiredRole="jobseeker">
      <View style={styles.container} collapsable={false}>
        {/* Enhanced Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Applications</Text>
            <Text style={styles.headerSubtitle}>
              Track and manage your job applications
            </Text>
          </View>
          <View style={styles.headerStats}>
            <Text style={styles.applicationCount}>
              {applications.length}
            </Text>
            <Text style={styles.applicationLabel}>
              Total{'\n'}Applications
            </Text>
          </View>
        </View>

        {/* Applications List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <MaterialIcons name="work" size={64} color="#e0e0e0" />
            <Text style={styles.loadingText}>Loading your applications...</Text>
          </View>
        ) : (
          <FlatList
            data={applications}
            renderItem={renderApplicationCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.applicationsList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#3498db']}
                tintColor="#3498db"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="work-outline" size={80} color="#d0d0d0" />
                <Text style={styles.emptyTitle}>No Applications Yet</Text>
                <Text style={styles.emptyDescription}>
                  Start your job search journey by applying to positions that match your skills and interests
                </Text>
                <TouchableOpacity
                  style={styles.exploreButton}
                  onPress={() => router.push('/(main)/jobseeker/jobs')}
                >
                  <MaterialIcons name="explore" size={20} color="white" />
                  <Text style={styles.exploreButtonText}>Explore Jobs</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: 'white',
    padding: 24,
    paddingTop: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a202c',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#718096',
    fontWeight: '500',
  },
  headerStats: {
    alignItems: 'center',
    paddingLeft: 20,
  },
  applicationCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3498db',
  },
  applicationLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    fontWeight: '500',
  },
  applicationsList: {
    padding: 16,
    paddingBottom: 30,
  },
  applicationCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  statusRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  cardContent: {
    padding: 20,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobInfo: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3748',
    lineHeight: 24,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  applicationMeta: {
    alignItems: 'flex-end',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
    fontWeight: '500',
  },
  coverLetterSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 6,
  },
  coverLetterText: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#edf2f7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  primaryAction: {
    backgroundColor: '#3498db',
  },
  secondaryAction: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dangerAction: {
    backgroundColor: '#fef5f5',
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  primaryActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  secondaryActionText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  dangerActionText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#a0aec0',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#a0aec0',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#cbd5e0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default JobSeekerApplications;