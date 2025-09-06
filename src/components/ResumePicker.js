// src/components/ResumePicker.js
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ProfileService } from '../services/profileService';
import { UploadService } from '../utils/uploadService';

const ResumePickerComponent = ({ onResumeSelected, currentResume, label = "Resume" }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handlePickResume = async () => {
    setLoading(true);
    try {
      const result = await UploadService.pickDocument();
      if (result.success) {
        // Upload to Firebase Storage
        const uploadResult = await ProfileService.uploadResume(user.uid, result.uri, result.name);
        if (uploadResult.success) {
          onResumeSelected({
            url: uploadResult.url,
            name: uploadResult.fileName,
            size: result.size
          });
          Alert.alert('Success', 'Resume uploaded successfully!');
        } else {
          Alert.alert('Error', 'Failed to upload resume: ' + uploadResult.error);
        }
      } else if (result.error && result.error !== 'Document selection cancelled') {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process resume: ' + error.message);
    }
    setLoading(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity onPress={handlePickResume} style={styles.resumeContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#3498db" />
        ) : currentResume ? (
          <View style={styles.resumeInfo}>
            <MaterialIcons name="description" size={40} color="#3498db" />
            <View style={styles.resumeDetails}>
              <Text style={styles.resumeName} numberOfLines={1}>
                {currentResume.name}
              </Text>
              <Text style={styles.resumeSize}>
                {formatFileSize(currentResume.size)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <MaterialIcons name="upload-file" size={40} color="#bdc3c7" />
            <Text style={styles.placeholderText}>Upload Resume</Text>
            <Text style={styles.placeholderSubtext}>PDF, DOC, DOCX (Max 5MB)</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handlePickResume} style={styles.uploadButton}>
        <MaterialIcons name="file-upload" size={20} color="#3498db" />
        <Text style={styles.uploadButtonText}>
          {currentResume ? 'Change Resume' : 'Select Resume'}
        </Text>
      </TouchableOpacity>
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
  resumeContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    marginBottom: 10,
  },
  resumeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  resumeDetails: {
    marginLeft: 15,
    flex: 1,
  },
  resumeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  resumeSize: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: 10,
    color: '#2c3e50',
    fontSize: 16,
    fontWeight: '500',
  },
  placeholderSubtext: {
    marginTop: 5,
    color: '#bdc3c7',
    fontSize: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  uploadButtonText: {
    marginLeft: 8,
    color: '#3498db',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ResumePickerComponent;
