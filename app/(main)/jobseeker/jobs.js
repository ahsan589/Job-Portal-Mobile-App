 // app/(main)/jobseeker/jobs.js
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
  StatusBar,
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
  const [scrollY] = useState(new Animated.Value(0));

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
        setFilteredJobs(result.data);
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

  // Animated header background
  const headerBackground = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,1)'],
    extrapolate: 'clamp',
  });

  // Animated header shadow
  const headerShadow = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 5],
    extrapolate: 'clamp',
  });

  const renderJobCard = ({ item, index }) => (
    <Animated.View
      style={[
        styles.jobCard,
        {
          opacity: 1,
          transform: [{
            translateY: 1
          }]
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.jobCardContent}
        onPress={() => router.push({
          pathname: '/(main)/jobseeker/job-details',
          params: { jobId: item.id }
        })}
        activeOpacity={0.7}
      >
        <View style={styles.jobHeader}>
          <View style={styles.companyInfo}>
            <View style={styles.titleContainer}>
              <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
              {item.featured && (
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredText}>Featured</Text>
                </View>
              )}
            </View>
            <View style={styles.companyContainer}>
              <View style={styles.companyAvatar}>
                <Text style={styles.companyAvatarText}>
                  {item.company?.charAt(0) || 'C'}
                </Text>
              </View>
              <Text style={styles.companyName}>{item.company}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={(e) => {
              e.stopPropagation();
              handleApply(item.id);
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="send" size={16} color="white" />
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.detailText} numberOfLines={1}>{item.location}</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="work-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.jobType}</Text>
            </View>
            <View style={styles.detailItem}>
              <FontAwesome5 name="clock" size={12} color="#666" />
              <Text style={styles.detailText}>
                {item.postedAt?.toDate ? item.postedAt.toDate().toLocaleDateString() : 'Recent'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.jobDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.jobFooter}>
          <View style={styles.salaryContainer}>
            <FontAwesome5 name="money-bill-wave" size={12} color="#27ae60" />
            <Text style={styles.salaryText}>{item.salary || 'Competitive Salary'}</Text>
          </View>
          <View style={styles.applicationsContainer}>
            <Ionicons name="people" size={14} color="#7f8c8d" />
            <Text style={styles.applicationsText}>
              {item.applicationsCount || 0}
            </Text>
          </View>
        </View>

        {item.skills && item.skills.length > 0 && (
          <View style={styles.skillsContainer}>
            {item.skills.slice(0, 3).map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
            {item.skills.length > 3 && (
              <View style={styles.moreSkillsTag}>
                <Text style={styles.moreSkillsText}>+{item.skills.length - 3}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const handleApplyFilters = () => {
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

  const QuickFilter = ({ icon, label, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.quickFilter, isActive && styles.quickFilterActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialIcons 
        name={icon} 
        size={16} 
        color={isActive ? "#fff" : "#666"} 
      />
      <Text style={[
        styles.quickFilterText,
        isActive && styles.quickFilterTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <RoleGuard requiredRole="jobseeker">
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        
        {/* Enhanced Header */}
        <Animated.View style={[
          styles.header,
          {
            backgroundColor: headerBackground,
            shadowOpacity: headerShadow.interpolate({
              inputRange: [0, 5],
              outputRange: [0, 0.1],
            }),
            elevation: headerShadow,
          }
        ]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Find Your Dream Job</Text>
              <Text style={styles.headerSubtitle}>
                {filteredJobs.length} opportunities waiting
              </Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.container} collapsable={false}>
          {/* Enhanced Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <MaterialIcons name="search" size={22} color="#7f8c8d" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Job title, company, or keywords..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={20} color="#7f8c8d" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Quick Filters */}
          <View style={styles.quickFiltersContainer}>
            <Text style={styles.quickFiltersTitle}>Quick Filters</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.quickFiltersScroll}
              contentContainerStyle={styles.quickFiltersContent}
            >
              <QuickFilter 
                icon="work-outline" 
                label="Full-time" 
                isActive={filters.jobType.includes('Full-time')}
                onPress={() => {
                  const newJobTypes = filters.jobType.includes('Full-time')
                    ? filters.jobType.filter(type => type !== 'Full-time')
                    : [...filters.jobType, 'Full-time'];
                  setFilters({...filters, jobType: newJobTypes});
                }}
              />
              <QuickFilter 
                icon="schedule" 
                label="Part-time" 
                isActive={filters.jobType.includes('Part-time')}
                onPress={() => {
                  const newJobTypes = filters.jobType.includes('Part-time')
                    ? filters.jobType.filter(type => type !== 'Part-time')
                    : [...filters.jobType, 'Part-time'];
                  setFilters({...filters, jobType: newJobTypes});
                }}
              />
              <QuickFilter 
                icon="home-work" 
                label="Remote" 
                isActive={filters.remote}
                onPress={() => setFilters({...filters, remote: !filters.remote})}
              />
              <QuickFilter 
                icon="trending-up" 
                label="Entry Level" 
                isActive={filters.experienceLevel.includes('Entry')}
                onPress={() => {
                  const newLevels = filters.experienceLevel.includes('Entry')
                    ? filters.experienceLevel.filter(level => level !== 'Entry')
                    : [...filters.experienceLevel, 'Entry'];
                  setFilters({...filters, experienceLevel: newLevels});
                }}
              />
            </ScrollView>
          </View>

          {/* Advanced Filters Button */}
          <TouchableOpacity
            style={styles.advancedFilterButton}
            onPress={() => setShowAdvancedFilters(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="tune" size={18} color="#3498db" />
            <Text style={styles.advancedFilterText}>Advanced Filters</Text>
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>
                {Object.values(filters).filter(v => 
                  Array.isArray(v) ? v.length > 0 : 
                  typeof v === 'object' ? Object.values(v).some(x => x) : 
                  v
                ).length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Results Header */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsText}>
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
            </Text>
            <TouchableOpacity style={styles.sortButton}>
              <Text style={styles.sortText}>Sort: Newest</Text>
              <MaterialIcons name="arrow-drop-down" size={16} color="#3498db" />
            </TouchableOpacity>
          </View>

          {/* Jobs List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingSpinner}>
                <MaterialIcons name="work-outline" size={32} color="#3498db" />
              </View>
              <Text style={styles.loadingText}>Finding great jobs for you...</Text>
            </View>
          ) : (
            <Animated.FlatList
              data={filteredJobs}
              renderItem={renderJobCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.jobsList}
              showsVerticalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={16}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="work-off" size={80} color="#e0e0e0" />
                  <Text style={styles.emptyText}>No jobs found</Text>
                  <Text style={styles.emptySubtext}>
                    Try adjusting your search criteria or check back later for new opportunities
                  </Text>
                  <TouchableOpacity 
                    style={styles.emptyActionButton}
                    onPress={handleClearFilters}
                  >
                    <Text style={styles.emptyActionText}>Clear All Filters</Text>
                  </TouchableOpacity>
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
      </SafeAreaView>
    </RoleGuard>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: StatusBar.currentHeight,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  profileButton: {
    padding: 5,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginTop: 80, // Space for header
  },
  searchContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  quickFiltersContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  quickFiltersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  quickFiltersScroll: {
    flexGrow: 0,
  },
  quickFiltersContent: {
    paddingRight: 20,
  },
  quickFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickFilterActive: {
    backgroundColor: '#3498db',
  },
  quickFilterText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  quickFilterTextActive: {
    color: 'white',
  },
  advancedFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  advancedFilterText: {
    marginLeft: 8,
    marginRight: 8,
    color: '#3498db',
    fontWeight: '500',
    fontSize: 14,
  },
  filterCount: {
    backgroundColor: '#e74c3c',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  resultsText: {
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: '500',
  },
  jobsList: {
    padding: 20,
    paddingTop: 0,
  },
  jobCard: {
    backgroundColor: 'white',
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  jobCardContent: {
    padding: 20,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  companyInfo: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  featuredBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  featuredText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  companyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  companyAvatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  companyName: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  jobDetails: {
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    marginLeft: 6,
    color: '#666',
    fontSize: 13,
    flex: 1,
  },
  jobDescription: {
    color: '#5d6d7e',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  salaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salaryText: {
    marginLeft: 6,
    color: '#27ae60',
    fontWeight: 'bold',
    fontSize: 14,
  },
  applicationsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicationsText: {
    marginLeft: 4,
    color: '#7f8c8d',
    fontSize: 13,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillTag: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  skillText: {
    color: '#2c3e50',
    fontSize: 12,
    fontWeight: '500',
  },
  moreSkillsTag: {
    backgroundColor: '#bdc3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moreSkillsText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 20,
    color: '#7f8c8d',
    marginTop: 20,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyActionButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyActionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default JobSeekerJobs;