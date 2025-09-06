// app/(main)/jobseeker/jobs.js
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import AdvancedJobFilter from '../../../src/components/AdvancedJobFilter';
import RoleGuard from '../../../src/components/RoleGuard';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useFocusReload } from '../../../src/hooks/useFocusReload';
import { JobService } from '../../../src/services/jobService';

const JobSeekerJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    jobType: [],
    experienceLevel: [],
    location: [],
    salary: { min: '', max: '' },
    datePosted: '',
    industry: [],
    remote: false,
    hybrid: false
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  useFocusReload(() => {
    loadJobs();
  }, []);

  // Reload jobs when search or filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadJobs();
    }, 300); // Debounce for 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, filters]);

  const loadJobs = async () => {
    console.log('Loading jobs for jobseeker');
    setLoading(true);

    try {
      const result = await JobService.getJobs(filters, searchQuery);
      console.log('Jobs result:', result);

      setLoading(false);

      if (result.success) {
        console.log('Jobs loaded:', result.data.length);
        setJobs(result.data);
        setFilteredJobs(result.data); // Set filtered jobs directly from service
      } else {
        console.error('Error loading jobs:', result.error);
        Alert.alert('Error', result.error || 'Failed to load jobs');
      }
    } catch (error) {
      console.error('Exception loading jobs:', error);
      setLoading(false);
      Alert.alert('Error', 'An unexpected error occurred while loading jobs');
    }
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
            } else {
              Alert.alert('Error', result.error);
            }
          }
        }
      ]
    );
  };

  const renderJobCard = ({ item }) => (
    <TouchableOpacity style={styles.jobCard} onPress={() => router.push({
      pathname: '/(main)/jobseeker/job-details',
      params: { jobId: item.id }
    })}>
      <View style={styles.jobHeader}>
        <View style={styles.companyInfo}>
          <Text style={styles.jobTitle}>{item.title}</Text>
          <Text style={styles.companyName}>{item.company}</Text>
        </View>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => handleApply(item.id)}
        >
          <Text style={styles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.jobDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#7f8c8d" />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="work" size={16} color="#7f8c8d" />
          <Text style={styles.detailText}>{item.jobType}</Text>
        </View>
        <View style={styles.detailRow}>
          <FontAwesome5 name="clock" size={14} color="#7f8c8d" />
          <Text style={styles.detailText}>
            {item.postedAt?.toDate ? item.postedAt.toDate().toLocaleDateString() : 'Recently'}
          </Text>
        </View>
      </View>

      <Text style={styles.jobDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.jobFooter}>
        <View style={styles.salaryContainer}>
          <FontAwesome5 name="money-bill-wave" size={14} color="#27ae60" />
          <Text style={styles.salaryText}>{item.salary || 'Competitive'}</Text>
        </View>
        <Text style={styles.applicationsText}>
          {item.applicationsCount || 0} applications
        </Text>
      </View>
    </TouchableOpacity>
  );

  const handleApplyFilters = () => {
    // Filters are already updated via onFiltersChange
    setShowAdvancedFilters(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      jobType: [],
      experienceLevel: [],
      location: [],
      salary: { min: '', max: '' },
      datePosted: '',
      industry: [],
      remote: false,
      hybrid: false
    };
    setFilters(clearedFilters);
    setShowAdvancedFilters(false);
  };

  return (
    <RoleGuard requiredRole="jobseeker">
      <View style={styles.container} collapsable={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#7f8c8d" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs, companies, or keywords..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
          <TouchableOpacity
            style={styles.filterToggle}
            onPress={() => setShowAdvancedFilters(true)}
          >
            <MaterialIcons name="filter-list" size={20} color="#3498db" />
            <Text style={styles.filterToggleText}>Advanced Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Results Count */}
        <Text style={styles.resultsText}>
          {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
        </Text>

        {/* Jobs List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading jobs...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredJobs}
            renderItem={renderJobCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.jobsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="work-off" size={64} color="#bdc3c7" />
                <Text style={styles.emptyText}>No jobs found</Text>
                <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
              </View>
            }
          />
        )}

        {/* Advanced Job Filter Modal */}
        <AdvancedJobFilter
          visible={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          filters={filters}
          onFiltersChange={setFilters}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
        />
      </View>
    </RoleGuard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  filterSection: {
    marginHorizontal: 15,
    marginBottom: 10,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  filterToggleText: {
    marginLeft: 8,
    color: '#3498db',
    fontWeight: '500',
  },

  resultsText: {
    marginHorizontal: 15,
    marginBottom: 10,
    color: '#7f8c8d',
    fontSize: 14,
  },
  jobsList: {
    padding: 15,
    paddingTop: 0,
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
  companyInfo: {
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
  applyButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  jobDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    marginLeft: 8,
    color: '#7f8c8d',
    fontSize: 14,
  },
  jobDescription: {
    color: '#34495e',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salaryText: {
    marginLeft: 5,
    color: '#27ae60',
    fontWeight: 'bold',
    fontSize: 14,
  },
  applicationsText: {
    color: '#7f8c8d',
    fontSize: 12,
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
});

export default JobSeekerJobs;
