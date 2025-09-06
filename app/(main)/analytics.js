// app/(main)/analytics.js
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import RoleGuard from '../../src/components/RoleGuard';

const { width } = Dimensions.get('window');

const AnalyticsScreen = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState('30d'); // '7d', '30d', '90d', '1y'

  // Mock analytics data
  const mockAnalytics = {
    overview: {
      totalJobs: 12,
      activeJobs: 8,
      totalApplications: 156,
      totalViews: 2340,
      averageApplicationsPerJob: 13,
      responseRate: 78,
    },
    jobPerformance: [
      {
        jobId: '1',
        title: 'Senior React Developer',
        applications: 25,
        views: 180,
        status: 'active',
        postedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15), // 15 days ago
      },
      {
        jobId: '2',
        title: 'Product Manager',
        applications: 18,
        views: 145,
        status: 'active',
        postedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10), // 10 days ago
      },
      {
        jobId: '3',
        title: 'UX Designer',
        applications: 12,
        views: 98,
        status: 'active',
        postedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8), // 8 days ago
      },
      {
        jobId: '4',
        title: 'DevOps Engineer',
        applications: 8,
        views: 67,
        status: 'closed',
        postedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
      },
    ],
    applicationTrends: [
      { date: '2024-01-01', applications: 5 },
      { date: '2024-01-02', applications: 8 },
      { date: '2024-01-03', applications: 12 },
      { date: '2024-01-04', applications: 15 },
      { date: '2024-01-05', applications: 10 },
      { date: '2024-01-06', applications: 18 },
      { date: '2024-01-07', applications: 22 },
    ],
    topSkills: [
      { skill: 'JavaScript', count: 45 },
      { skill: 'React', count: 38 },
      { skill: 'Node.js', count: 32 },
      { skill: 'Python', count: 28 },
      { skill: 'AWS', count: 25 },
    ],
    demographics: {
      experienceLevels: [
        { level: 'Entry Level', count: 25, percentage: 16 },
        { level: 'Mid Level', count: 68, percentage: 44 },
        { level: 'Senior Level', count: 45, percentage: 29 },
        { level: 'Executive', count: 18, percentage: 11 },
      ],
      locations: [
        { location: 'New York', count: 35 },
        { location: 'San Francisco', count: 28 },
        { location: 'Austin', count: 22 },
        { location: 'Seattle', count: 18 },
        { location: 'Remote', count: 53 },
      ],
    },
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = () => {
    // In a real app, this would fetch from your backend
    setAnalyticsData(mockAnalytics);
  };

  const MetricCard = ({ title, value, subtitle, icon, color = '#3498db' }) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <MaterialIcons name={icon} size={24} color={color} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const JobPerformanceItem = ({ job }) => (
    <View style={styles.jobItem}>
      <View style={styles.jobInfo}>
        <Text style={styles.jobTitle}>{job.title}</Text>
        <Text style={styles.jobDate}>
          Posted {Math.floor((Date.now() - job.postedDate) / (1000 * 60 * 60 * 24))} days ago
        </Text>
      </View>
      <View style={styles.jobStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{job.applications}</Text>
          <Text style={styles.statLabel}>Applications</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{job.views}</Text>
          <Text style={styles.statLabel}>Views</Text>
        </View>
        <View style={[styles.statusBadge, job.status === 'active' ? styles.statusActive : styles.statusClosed]}>
          <Text style={styles.statusText}>{job.status}</Text>
        </View>
      </View>
    </View>
  );

  const SkillItem = ({ skill, count, index }) => (
    <View style={styles.skillItem}>
      <Text style={styles.skillRank}>#{index + 1}</Text>
      <View style={styles.skillInfo}>
        <Text style={styles.skillName}>{skill}</Text>
        <View style={styles.skillBar}>
          <View
            style={[styles.skillBarFill, { width: `${(count / 45) * 100}%` }]}
          />
        </View>
      </View>
      <Text style={styles.skillCount}>{count}</Text>
    </View>
  );

  const renderTimeRangeButton = (range, label) => (
    <TouchableOpacity
      style={[styles.timeRangeButton, timeRange === range && styles.timeRangeButtonActive]}
      onPress={() => setTimeRange(range)}
    >
      <Text style={[styles.timeRangeText, timeRange === range && styles.timeRangeTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (!analyticsData) {
    return (
      <RoleGuard requiredRole="employer">
        <View style={styles.loadingContainer}>
          <Text>Loading analytics...</Text>
        </View>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="employer">
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#2c3e50" />
          </TouchableOpacity>
          <Text style={styles.title}>Analytics</Text>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          {renderTimeRangeButton('7d', '7 Days')}
          {renderTimeRangeButton('30d', '30 Days')}
          {renderTimeRangeButton('90d', '90 Days')}
          {renderTimeRangeButton('1y', '1 Year')}
        </View>

        {/* Overview Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Total Jobs"
              value={analyticsData.overview.totalJobs}
              icon="work"
              color="#3498db"
            />
            <MetricCard
              title="Active Jobs"
              value={analyticsData.overview.activeJobs}
              icon="schedule"
              color="#27ae60"
            />
            <MetricCard
              title="Total Applications"
              value={analyticsData.overview.totalApplications}
              icon="people"
              color="#e67e22"
            />
            <MetricCard
              title="Job Views"
              value={analyticsData.overview.totalViews}
              icon="visibility"
              color="#9b59b6"
            />
            <MetricCard
              title="Avg Applications/Job"
              value={analyticsData.overview.averageApplicationsPerJob}
              icon="trending-up"
              color="#1abc9c"
            />
            <MetricCard
              title="Response Rate"
              value={`${analyticsData.overview.responseRate}%`}
              icon="message"
              color="#e74c3c"
            />
          </View>
        </View>

        {/* Job Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Performance</Text>
          {analyticsData.jobPerformance.map((job) => (
            <JobPerformanceItem key={job.jobId} job={job} />
          ))}
        </View>

        {/* Top Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Skills in Applications</Text>
          {analyticsData.topSkills.map((skill, index) => (
            <SkillItem
              key={skill.skill}
              skill={skill.skill}
              count={skill.count}
              index={index}
            />
          ))}
        </View>

        {/* Demographics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Applicant Demographics</Text>

          <View style={styles.demographicsSection}>
            <Text style={styles.demographicsTitle}>Experience Levels</Text>
            {analyticsData.demographics.experienceLevels.map((level) => (
              <View key={level.level} style={styles.demographicItem}>
                <Text style={styles.demographicLabel}>{level.level}</Text>
                <View style={styles.demographicBar}>
                  <View
                    style={[styles.demographicBarFill, { width: `${level.percentage}%` }]}
                  />
                </View>
                <Text style={styles.demographicValue}>{level.percentage}%</Text>
              </View>
            ))}
          </View>

          <View style={styles.demographicsSection}>
            <Text style={styles.demographicsTitle}>Top Locations</Text>
            {analyticsData.demographics.locations.map((location) => (
              <View key={location.location} style={styles.locationItem}>
                <Text style={styles.locationName}>{location.location}</Text>
                <Text style={styles.locationCount}>{location.count} applicants</Text>
              </View>
            ))}
          </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  timeRangeText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: '#ffffff',
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    borderRadius: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - 40 - 30) / 2, // Account for padding and gap
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricTitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 8,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  jobItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  jobDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  jobStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    marginLeft: 15,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    marginLeft: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#d4edda',
  },
  statusClosed: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  skillRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
    width: 30,
  },
  skillInfo: {
    flex: 1,
    marginRight: 15,
  },
  skillName: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 5,
  },
  skillBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
  },
  skillBarFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 2,
  },
  skillCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  demographicsSection: {
    marginBottom: 25,
  },
  demographicsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  demographicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  demographicLabel: {
    width: 100,
    fontSize: 14,
    color: '#2c3e50',
  },
  demographicBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginHorizontal: 10,
  },
  demographicBarFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  demographicValue: {
    width: 40,
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'right',
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  locationName: {
    fontSize: 14,
    color: '#2c3e50',
  },
  locationCount: {
    fontSize: 12,
    color: '#7f8c8d',
  },
});

export default AnalyticsScreen;
