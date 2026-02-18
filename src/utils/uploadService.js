// src/utils/uploadService.js
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Helper function to convert blob to base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const UploadService = {
  // Pick image from gallery or camera
  pickImage: async (options = {}) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        return { success: false, error: 'Permission denied' };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        ...options
      });

      if (!result.canceled) {
        return { success: true, uri: result.assets[0].uri };
      }
      
      return { success: false, error: 'Image selection cancelled' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Take photo with camera
  takePhoto: async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        return { success: false, error: 'Camera permission denied' };
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        return { success: true, uri: result.assets[0].uri };
      }
      
      return { success: false, error: 'Camera cancelled' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Pick document (resume)
  pickDocument: async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });

      if (result.assets && result.assets.length > 0) {
        return { 
          success: true, 
          uri: result.assets[0].uri, 
          name: result.assets[0].name,
          size: result.assets[0].size
        };
      }
      
      return { success: false, error: 'Document selection cancelled' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Upload file directly to Firestore as base64
  uploadFile: async (fileUri, folder = 'uploads') => {
    try {
      console.log('Starting file upload to Firestore...');

      // Fetch the file
      const response = await fetch(fileUri);
      const blob = await response.blob();

      console.log('File fetched, converting to base64...');

      // Convert to base64
      const base64 = await blobToBase64(blob);
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Generate unique document ID
      const uploadDocId = `${folder}_${fileName}_${Date.now()}`;

      console.log('Storing in Firestore...');

      // Store in Firestore uploads collection
      await setDoc(doc(db, 'uploads', uploadDocId), {
        fileName,
        folder,
        base64Data: base64,
        storageType: 'firestore',
        uploadedAt: new Date(),
        fileSize: blob.size,
        mimeType: blob.type || 'application/octet-stream'
      });

      console.log('File uploaded successfully to Firestore');

      // Return base64 data URL for immediate use
      const mimeType = blob.type || 'application/octet-stream';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return {
        success: true,
        url: dataUrl,
        fileName,
        storage: 'firestore',
        docId: uploadDocId,
        mimeType
      };
    } catch (error) {
      console.error('File upload failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Get file size in readable format
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};
