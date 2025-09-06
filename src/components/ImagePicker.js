// src/components/ImagePicker.js
import { MaterialIcons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ProfileService } from '../services/profileService';
import { UploadService } from '../utils/uploadService';

const ImagePickerComponent = ({ onImageSelected, currentImage, label = "Profile Image" }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  const handlePickImage = async () => {
    setLoading(true);
    try {
      const result = await UploadService.pickImage();
      if (result.success) {
        // Upload to Firebase Storage
        const uploadResult = await ProfileService.uploadProfileImage(user.uid, result.uri);
        if (uploadResult.success) {
          onImageSelected(uploadResult.url);
          Alert.alert('Success', 'Profile image updated successfully!');
        } else {
          Alert.alert('Error', 'Failed to upload image: ' + uploadResult.error);
        }
      } else if (result.error && result.error !== 'Image selection cancelled') {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process image: ' + error.message);
    }
    setLoading(false);
  };

  const handleTakePhoto = async () => {
    setLoading(true);
    try {
      const result = await UploadService.takePhoto();
      if (result.success) {
        // Upload to Firebase Storage
        const uploadResult = await ProfileService.uploadProfileImage(user.uid, result.uri);
        if (uploadResult.success) {
          onImageSelected(uploadResult.url);
          Alert.alert('Success', 'Profile image updated successfully!');
        } else {
          Alert.alert('Error', 'Failed to upload image: ' + uploadResult.error);
        }
      } else if (result.error !== 'Camera cancelled') {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process image: ' + error.message);
    }
    setLoading(false);
  };

  const showImageOptions = () => {
    Alert.alert(
      'Choose Option',
      'Select image from:',
      [
        {
          text: 'Gallery',
          onPress: handlePickImage
        },
        {
          text: 'Camera',
          onPress: handleTakePhoto
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  // Animation functions
  const animatePressIn = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animatePressOut = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateButtonPressIn = () => {
    Animated.timing(buttonScaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const animateButtonPressOut = () => {
    Animated.timing(buttonScaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <Animated.View style={[styles.imageContainer, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        <TouchableOpacity
          onPress={showImageOptions}
          onPressIn={animatePressIn}
          onPressOut={animatePressOut}
          style={styles.imageTouchable}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#3498db" />
          ) : currentImage ? (
            <Image source={{ uri: currentImage }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <MaterialIcons name="add-a-photo" size={40} color="#bdc3c7" />
              <Text style={styles.placeholderText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.buttonContainer}>
        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity
            onPress={handlePickImage}
            onPressIn={animateButtonPressIn}
            onPressOut={animateButtonPressOut}
            style={styles.optionButton}
          >
            <MaterialIcons name="photo-library" size={20} color="#3498db" />
            <Text style={styles.optionText}>Gallery</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity
            onPress={handleTakePhoto}
            onPressIn={animateButtonPressIn}
            onPressOut={animateButtonPressOut}
            style={styles.optionButton}
          >
            <MaterialIcons name="camera-alt" size={20} color="#3498db" />
            <Text style={styles.optionText}>Camera</Text>
          </TouchableOpacity>
        </Animated.View>
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
    marginBottom: 10,
    color: '#2c3e50',
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  imageTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 5,
    color: '#bdc3c7',
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  optionText: {
    marginLeft: 5,
    color: '#3498db',
    fontWeight: '500',
  },
});

export default ImagePickerComponent;