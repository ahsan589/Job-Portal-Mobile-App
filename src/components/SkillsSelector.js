// src/components/SkillsSelector.js
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ProfileService } from '../services/profileService';

const SkillsSelector = ({ skills = [], onSkillsChange, label = "Skills" }) => {
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const predefinedSkills = [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Swift',
    'Kotlin', 'React', 'Angular', 'Vue.js', 'Node.js', 'Express.js',
    'Django', 'Flask', 'Spring Boot', 'Laravel', 'MySQL', 'PostgreSQL',
    'MongoDB', 'Redis', 'AWS', 'Docker', 'Kubernetes', 'Git', 'HTML',
    'CSS', 'SASS', 'TypeScript', 'React Native', 'Flutter', 'Machine Learning',
    'Data Analysis', 'UI/UX Design', 'Project Management', 'Agile', 'Scrum'
  ];

  const addSkill = async (skill) => {
    if (!skill.trim()) return;

    const skillToAdd = skill.trim();
    if (skills.includes(skillToAdd)) {
      Alert.alert('Error', 'Skill already exists');
      return;
    }

    setLoading(true);
    try {
      const result = await ProfileService.addSkill(user.uid, skillToAdd);
      if (result.success) {
        onSkillsChange([...skills, skillToAdd]);
        setNewSkill('');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add skill: ' + error.message);
    }
    setLoading(false);
  };

  const removeSkill = async (skillToRemove) => {
    setLoading(true);
    try {
      const result = await ProfileService.removeSkill(user.uid, skillToRemove);
      if (result.success) {
        onSkillsChange(skills.filter(skill => skill !== skillToRemove));
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to remove skill: ' + error.message);
    }
    setLoading(false);
  };

  const addPredefinedSkill = (skill) => {
    if (!skills.includes(skill)) {
      addSkill(skill);
    }
  };

  const renderSkill = ({ item }) => (
    <View style={styles.skillItem}>
      <Text style={styles.skillText}>{item}</Text>
      <TouchableOpacity
        onPress={() => removeSkill(item)}
        style={styles.removeButton}
        disabled={loading}
      >
        <MaterialIcons name="close" size={16} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );

  const renderPredefinedSkill = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.predefinedSkill,
        skills.includes(item) && styles.predefinedSkillSelected
      ]}
      onPress={() => addPredefinedSkill(item)}
      disabled={loading || skills.includes(item)}
    >
      <Text style={[
        styles.predefinedSkillText,
        skills.includes(item) && styles.predefinedSkillTextSelected
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* Current Skills */}
      {skills.length > 0 && (
        <View style={styles.currentSkillsContainer}>
          <Text style={styles.sectionTitle}>Your Skills:</Text>
          <FlatList
            data={skills}
            renderItem={renderSkill}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.skillsList}
          />
        </View>
      )}

      {/* Add New Skill */}
      <View style={styles.addSkillContainer}>
        <TextInput
          style={styles.skillInput}
          placeholder="Add a new skill..."
          value={newSkill}
          onChangeText={setNewSkill}
          onSubmitEditing={() => addSkill(newSkill)}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.addButton, loading && styles.addButtonDisabled]}
          onPress={() => addSkill(newSkill)}
          disabled={loading || !newSkill.trim()}
        >
          <MaterialIcons
            name="add"
            size={20}
            color={loading || !newSkill.trim() ? "#bdc3c7" : "#3498db"}
          />
        </TouchableOpacity>
      </View>

      {/* Predefined Skills */}
      <View style={styles.predefinedContainer}>
        <Text style={styles.sectionTitle}>Popular Skills:</Text>
        <FlatList
          data={predefinedSkills}
          renderItem={renderPredefinedSkill}
          keyExtractor={(item) => item}
          numColumns={3}
          columnWrapperStyle={styles.predefinedGrid}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.predefinedList}
        />
      </View>
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
    marginBottom: 15,
    color: '#2c3e50',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 10,
  },
  currentSkillsContainer: {
    marginBottom: 20,
  },
  skillsList: {
    paddingVertical: 5,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  removeButton: {
    padding: 2,
  },
  addSkillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  skillInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
    marginRight: 10,
  },
  addButton: {
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  addButtonDisabled: {
    borderColor: '#bdc3c7',
  },
  predefinedContainer: {
    marginTop: 10,
  },
  predefinedList: {
    paddingBottom: 10,
  },
  predefinedGrid: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  predefinedSkill: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginRight: 8,
    marginBottom: 8,
    flex: 1,
    alignItems: 'center',
  },
  predefinedSkillSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  predefinedSkillText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  predefinedSkillTextSelected: {
    color: 'white',
  },
});

export default SkillsSelector;
