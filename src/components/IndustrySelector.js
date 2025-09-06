// src/components/IndustrySelector.js
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const IndustrySelector = ({ selectedIndustry, onIndustryChange, label = "Industry" }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Retail',
    'Manufacturing',
    'Construction',
    'Transportation',
    'Hospitality',
    'Real Estate',
    'Media & Entertainment',
    'Telecommunications',
    'Energy',
    'Agriculture',
    'Automotive',
    'Aerospace',
    'Pharmaceuticals',
    'Food & Beverage',
    'Consulting',
    'Legal Services',
    'Non-Profit',
    'Government',
    'Other'
  ];

  const handleIndustrySelect = (industry) => {
    onIndustryChange(industry);
    setModalVisible(false);
  };

  const renderIndustry = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.industryItem,
        selectedIndustry === item && styles.industryItemSelected
      ]}
      onPress={() => handleIndustrySelect(item)}
    >
      <Text style={[
        styles.industryText,
        selectedIndustry === item && styles.industryTextSelected
      ]}>
        {item}
      </Text>
      {selectedIndustry === item && (
        <MaterialIcons name="check" size={20} color="#3498db" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[
          styles.selectorText,
          selectedIndustry ? styles.selectorTextSelected : styles.selectorTextPlaceholder
        ]}>
          {selectedIndustry || 'Select your industry...'}
        </Text>
        <MaterialIcons
          name="keyboard-arrow-down"
          size={24}
          color="#bdc3c7"
        />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Industry</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={industries}
              renderItem={renderIndustry}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.industriesList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
  },
  selectorText: {
    fontSize: 16,
    flex: 1,
  },
  selectorTextSelected: {
    color: '#2c3e50',
  },
  selectorTextPlaceholder: {
    color: '#bdc3c7',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 5,
  },
  industriesList: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  industryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  industryItemSelected: {
    backgroundColor: '#f8f9fa',
  },
  industryText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  industryTextSelected: {
    color: '#3498db',
    fontWeight: '600',
  },
});

export default IndustrySelector;
