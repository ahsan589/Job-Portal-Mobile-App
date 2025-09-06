// app/(main)/employer/jobs.js
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
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

const EmployerJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleDeleteJob = async (jobId, jobTitle) => {
    console.log('Delete job initiated:', { jobId, jobTitle });

    Alert.alert(
      'Delete Job',
      `Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`,
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
                Alert.alert('Success', 'Job deleted successfully');
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

  const renderJobCard = ({ item }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{item.title}</Text>
          <Text style={styles.jobLocation}>{item.location}</Text>
        </View>
        <View style={styles.jobStatus}>
          <Text style={[styles.statusText,
            item.status === 'active' && styles.statusActive,
            item.status === 'paused' && styles.statusPaused,
            item.status === 'closed' && styles.statusClosed
          ]}>
            {item.status?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.jobStats}>
        <View style={styles.statItem}>
          <MaterialIcons name="people" size={20} color="#3498db" />
          <Text style={styles.statValue}>{item.applicationsCount || 0}</Text>
          <Text style={styles.statLabel}>Applications</Text>
        </View>
        <View style={styles.statItem}>
          <FontAwesome5 name="eye" size={18} color="#2ecc71" />
          <Text style={styles.statValue}>{item.views || 0}</Text>
          <Text style={styles.statLabel}>Views</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialIcons name="access-time" size={20} color="#f39c12" />
          <Text style={styles.statValue}>
            {item.postedAt?.toDate ?
              Math.floor((new Date() - item.postedAt.toDate()) / (1000 * 60 * 60 * 24))
              : 0
            }
          </Text>
          <Text style={styles.statLabel}>Days</Text>
        </View>
      </View>

      <Text style={styles.jobDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.jobActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleViewApplications(item.id)}
        >
          <MaterialIcons name="people" size={18} color="#3498db" />
          <Text style={styles.actionText}>Applications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditJob(item.id)}
        >
          <MaterialIcons name="edit" size={18} color="#f39c12" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteJob(item.id, item.title)}
        >
          <MaterialIcons name="delete" size={18} color="#e74c3c" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <RoleGuard requiredRole="employer">
      <View style={styles.container} collapsable={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Jobs</Text>
          <TouchableOpacity
            style={styles.postJobButton}
            onPress={() => router.push('/(main)/employer/post-job')}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.postJobText}>Post Job</Text>
          </TouchableOpacity>
        </View>

        {/* Jobs List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading your jobs...</Text>
          </View>
        ) : (
          <FlatList
            data={jobs}
            renderItem={renderJobCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.jobsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="work-off" size={64} color="#bdc3c7" />
                <Text style={styles.emptyText}>No jobs posted yet</Text>
                <Text style={styles.emptySubtext}>Create your first job posting to get started</Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/(main)/employer/post-job')}
                >
                  <Text style={styles.emptyButtonText}>Post Your First Job</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  postJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postJobText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  jobsList: {
    padding: 15,
  },
  jobCard: {
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
  jobHeader: {
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
  jobLocation: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  jobStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusActive: {
    color: '#27ae60',
  },
  statusPaused: {
    color: '#f39c12',
  },
  statusClosed: {
    color: '#e74c3c',
  },
  jobStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  jobDescription: {
    color: '#34495e',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  jobActions: {
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
  deleteButton: {
    backgroundColor: '#fdf2f2',
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

export default EmployerJobs;
