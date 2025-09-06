// src/components/AdvancedJobFilter.js
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const AdvancedJobFilter = ({
  visible,
  onClose,
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters
}) => {
  const [tempFilters, setTempFilters] = useState(filters);

  const jobTypes = [
    'Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Temporary'
  ];

  const experienceLevels = [
    'Entry Level', 'Mid Level', 'Senior Level', 'Executive', 'Director'
  ];

  const locations = [
    'Remote', 'On-site', 'Hybrid', 'New York', 'San Francisco', 'Los Angeles',
    'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'
  ];

  const datePostedOptions = [
    { label: 'Any time', value: '' },
    { label: 'Last 24 hours', value: '1' },
    { label: 'Last 3 days', value: '3' },
    { label: 'Last week', value: '7' },
    { label: 'Last month', value: '30' }
  ];

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing',
    'Construction', 'Transportation', 'Hospitality', 'Real Estate', 'Media & Entertainment'
  ];

  const handleMultiSelect = (category, value) => {
    const currentValues = tempFilters[category] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];

    setTempFilters(prev => ({
      ...prev,
      [category]: newValues
    }));
  };

  const handleSingleSelect = (category, value) => {
    setTempFilters(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSalaryChange = (field, value) => {
    setTempFilters(prev => ({
      ...prev,
      salary: {
        ...prev.salary,
        [field]: value
      }
    }));
  };

  const applyFilters = () => {
    onFiltersChange(tempFilters);
    onApplyFilters();
    onClose();
  };

  const clearFilters = () => {
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
    setTempFilters(clearedFilters);
    onClearFilters();
  };

  const renderMultiSelectSection = (title, category, options) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.optionsGrid}>
        {options.map(option => {
          const isSelected = (tempFilters[category] || []).includes(option);
          return (
            <TouchableOpacity
              key={option}
              style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
              onPress={() => handleMultiSelect(category, option)}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderSingleSelectSection = (title, category, options) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.optionsList}>
        {options.map(option => {
          const isSelected = tempFilters[category] === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.optionRow, isSelected && styles.optionRowSelected]}
              onPress={() => handleSingleSelect(category, option.value)}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {option.label}
              </Text>
              {isSelected && <MaterialIcons name="check" size={20} color="#3498db" />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Advanced Filters</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#7f8c8d" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {renderMultiSelectSection('Job Type', 'jobType', jobTypes)}
            {renderMultiSelectSection('Experience Level', 'experienceLevel', experienceLevels)}
            {renderMultiSelectSection('Location', 'location', locations)}
            {renderMultiSelectSection('Industry', 'industry', industries)}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Salary Range</Text>
              <View style={styles.salaryContainer}>
                <TextInput
                  style={styles.salaryInput}
                  placeholder="Min salary"
                  value={tempFilters.salary?.min || ''}
                  onChangeText={(value) => handleSalaryChange('min', value)}
                  keyboardType="numeric"
                />
                <Text style={styles.salarySeparator}>-</Text>
                <TextInput
                  style={styles.salaryInput}
                  placeholder="Max salary"
                  value={tempFilters.salary?.max || ''}
                  onChangeText={(value) => handleSalaryChange('max', value)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {renderSingleSelectSection('Date Posted', 'datePosted', datePostedOptions)}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Work Arrangement</Text>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => handleSingleSelect('remote', !tempFilters.remote)}
                >
                  <View style={[styles.checkbox, tempFilters.remote && styles.checkboxChecked]}>
                    {tempFilters.remote && <MaterialIcons name="check" size={16} color="white" />}
                  </View>
                  <Text style={styles.checkboxLabel}>Remote work</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => handleSingleSelect('hybrid', !tempFilters.hybrid)}
                >
                  <View style={[styles.checkbox, tempFilters.hybrid && styles.checkboxChecked]}>
                    {tempFilters.hybrid && <MaterialIcons name="check" size={16} color="white" />}
                  </View>
                  <Text style={styles.checkboxLabel}>Hybrid work</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  optionButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  optionButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  optionText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  optionTextSelected: {
    color: 'white',
  },
  optionsList: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  optionRowSelected: {
    backgroundColor: '#e8f4fd',
  },
  salaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salaryInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: 'white',
  },
  salarySeparator: {
    marginHorizontal: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  checkboxContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#2c3e50',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  clearButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  clearButtonText: {
    color: '#e74c3c',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginLeft: 10,
    borderRadius: 8,
    backgroundColor: '#3498db',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default AdvancedJobFilter;
