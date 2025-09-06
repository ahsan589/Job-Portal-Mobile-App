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

const EmployerCandidates = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const loadCandidates = async () => {
    if (!user) {
      console.log('No user found for candidates');
      return;
    }

    console.log('Loading candidates for employer:', user.uid);
    setLoading(true);

    try {
      // For simplicity, load applications for all jobs posted by this employer
      // In a real app, you might paginate or filter by job
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
          // Add job info to each application
          const appsWithJobInfo = appsResult.data.map(app => ({
            ...app,
            jobTitle: job.title,
            companyName: job.company || 'Your Company'
          }));
          allApplications.push(...appsWithJobInfo);
        } else {
          console.error('Error loading applications for job', job.id, ':', appsResult.error);
        }
      }

      console.log('Total applications loaded:', allApplications.length);
      setApplications(allApplications);
      setLoading(false);
    } catch (error) {
      console.error('Exception loading candidates:', error);
      setLoading(false);
      Alert.alert('Error', 'An unexpected error occurred while loading candidates');
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

  const renderCandidateCard = ({ item }) => (
    <TouchableOpacity
      style={styles.candidateCard}
      onPress={() => router.push({
        pathname: '/(main)/employer/application-details',
        params: { applicationId: item.id }
      })}
    >
      <View style={styles.candidateHeader}>
        <View style={styles.candidateInfo}>
          <Text style={styles.jobTitle}>{item.jobTitle || 'Job Title'}</Text>
          <Text style={styles.candidateName}>{item.applicantName || 'Candidate'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.candidateDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="access-time" size={16} color="#7f8c8d" />
          <Text style={styles.detailText}>
            Applied {item.appliedAt?.toDate ?
              item.appliedAt.toDate().toLocaleDateString() : 'Recently'}
          </Text>
        </View>
        {item.resumeUrl && (
          <View style={styles.detailRow}>
            <MaterialIcons name="description" size={16} color="#7f8c8d" />
            <Text
              style={[styles.detailText, styles.linkText]}
              onPress={() => {
                // Open resume URL in browser or PDF viewer
                // For now, just alert
                Alert.alert('Resume', 'Open resume URL: ' + item.resumeUrl);
              }}
            >
              View Resume
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <RoleGuard requiredRole="employer">
      <View style={styles.container} collapsable={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Candidates</Text>
          <Text style={styles.headerSubtitle}>
            {applications.length} application{applications.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Candidates List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading candidates...</Text>
          </View>
        ) : (
          <FlatList
            data={applications}
            renderItem={renderCandidateCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.candidatesList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="people-outline" size={64} color="#bdc3c7" />
                <Text style={styles.emptyText}>No candidates yet</Text>
                <Text style={styles.emptySubtext}>
                  Candidates who apply to your jobs will appear here
                </Text>
              </View>
            }
          />
        )}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
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
  candidatesList: {
    padding: 15,
  },
  candidateCard: {
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
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  candidateInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  candidateName: {
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
  candidateDetails: {
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
  linkText: {
    textDecorationLine: 'underline',
    color: '#3498db',
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
  },
  backButton: {
    marginTop: 20,
    marginHorizontal: 15,
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EmployerCandidates;
