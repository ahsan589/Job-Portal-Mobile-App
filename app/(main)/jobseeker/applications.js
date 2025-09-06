
// app/(main)/jobseeker/applications.js
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import RoleGuard from '../../../src/components/RoleGuard';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useFocusReload } from '../../../src/hooks/useFocusReload';
import { JobService } from '../../../src/services/jobService';

const JobSeekerApplications = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'reviewed': return '#3498db';
      case 'accepted': return '#27ae60';
      case 'rejected': return '#e74c3c';
      default: return '#7f8c8d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'reviewed': return 'Under Review';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      default: return 'Unknown';
    }
  };

  const renderApplicationCard = ({ item }) => (
    <View
      style={styles.applicationCard}
    >
      <View style={styles.applicationHeader}>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{item.jobTitle || 'Job Title'}</Text>
          <Text style={styles.companyName}>{item.companyName || 'Company'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.applicationDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="access-time" size={16} color="#7f8c8d" />
          <Text style={styles.detailText}>
            Applied {item.appliedAt?.toDate ?
              item.appliedAt.toDate().toLocaleDateString() : 'Recently'}
          </Text>
        </View>
        {item.coverLetter && (
          <View style={styles.detailRow}>
            <MaterialIcons name="description" size={16} color="#7f8c8d" />
            <Text style={styles.detailText} numberOfLines={2}>
              {item.coverLetter}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.applicationActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push({
            pathname: '/(main)/jobseeker/job-details',
            params: { jobId: item.jobId }
          })}
        >
          <MaterialIcons name="visibility" size={18} color="#3498db" />
          <Text style={styles.actionText}>View Job</Text>
        </TouchableOpacity>

        {item.resumeUrl ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Open resume URL in new tab or download
              window.open(item.resumeUrl, '_blank');
            }}
          >
            <MaterialIcons name="file-download" size={18} color="#27ae60" />
            <Text style={styles.actionText}>Download Resume</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, { opacity: 0.5 }]}
            disabled
          >
            <MaterialIcons name="file-download" size={18} color="#7f8c8d" />
            <Text style={styles.actionText}>No Resume</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            Alert.alert('Withdraw Application', 'Are you sure you want to withdraw this application?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Withdraw', style: 'destructive', onPress: async () => {
                try {
                  const result = await JobService.withdrawApplication(item.id, item.jobId);
                  if (result.success) {
                    Alert.alert('Success', result.message);
                    loadApplications();
                  } else {
                    Alert.alert('Error', result.error || 'Failed to withdraw application');
                  }
                } catch (error) {
                  Alert.alert('Error', 'An unexpected error occurred');
                }
              }}
            ]);
          }}
        >
          <MaterialIcons name="cancel" size={18} color="#e74c3c" />
          <Text style={styles.actionText}>Withdraw</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <RoleGuard requiredRole="jobseeker">
      <View style={styles.container} collapsable={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Applications</Text>
          <Text style={styles.headerSubtitle}>
            {applications.length} application{applications.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Applications List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading your applications...</Text>
          </View>
        ) : (
          <FlatList
            data={applications}
            renderItem={renderApplicationCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.applicationsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="work-off" size={64} color="#bdc3c7" />
                <Text style={styles.emptyText}>No applications yet</Text>
                <Text style={styles.emptySubtext}>
                  Start applying to jobs to see your applications here
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/(main)/jobseeker/jobs')}
                >
                  <Text style={styles.emptyButtonText}>Browse Jobs</Text>
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  applicationsList: {
    padding: 15,
  },
  applicationCard: {
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
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  applicationDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    color: '#34495e',
    fontSize: 14,
    flex: 1,
  },
  applicationActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 15,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default JobSeekerApplications;
