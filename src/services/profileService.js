// src/services/profileService.js
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
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

export const ProfileService = {
  // Get user profile
  getProfile: async (userId) => {
    try {
      const profileDoc = await getDoc(doc(db, 'users', userId));
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        // Ensure all expected fields exist with defaults
        const completeProfile = {
          fullName: profileData.fullName || profileData.name || '',
          name: profileData.name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          skills: profileData.skills || [],
          experience: profileData.experience || '',
          education: profileData.education || '',
          resumeUrl: profileData.resumeUrl || null,
          title: profileData.title || '',
          bio: profileData.bio || '',
          location: profileData.location || '',
          linkedIn: profileData.linkedIn || '',
          github: profileData.github || '',
          industry: profileData.industry || '',
          jobPreferences: profileData.jobPreferences || {
            partTime: false,
            fullTime: true,
            remote: false,
            onSite: true,
            hybrid: false
          },
          ...profileData // Include any other fields
        };
        return { success: true, data: completeProfile };
      }

      // Return default profile structure for new users
      return {
        success: true,
        data: {
          fullName: '',
          name: '',
          email: '',
          phone: '',
          skills: [],
          experience: '',
          education: '',
          resumeUrl: null,
          title: '',
          bio: '',
          location: '',
          linkedIn: '',
          github: '',
          industry: '',
          jobPreferences: {
            partTime: false,
            fullTime: true,
            remote: false,
            onSite: true,
            hybrid: false
          }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update job seeker profile
  updateJobSeekerProfile: async (userId, profileData) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        ...profileData,
        role: 'jobseeker',
        updatedAt: new Date()
      }, { merge: true });
      
      return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Update employer profile
  updateEmployerProfile: async (userId, profileData) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        ...profileData,
        role: 'employer',
        updatedAt: new Date()
      }, { merge: true });
      
      return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Upload profile image directly to Firestore
  uploadProfileImage: async (userId, imageUri) => {
    try {
      console.log('Uploading profile image to Firestore...');

      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);

      // Generate unique document ID for the image
      const imageDocId = `profile_image_${userId}_${Date.now()}`;

      // Store image in Firestore uploads collection
      await setDoc(doc(db, 'uploads', imageDocId), {
        userId,
        fileName: `profile_image_${userId}.jpg`,
        folder: 'profile-images',
        base64Data: base64,
        storageType: 'firestore',
        uploadedAt: new Date(),
        fileSize: blob.size,
        mimeType: blob.type || 'image/jpeg'
      });

      // Update user's profile with image reference
      await updateDoc(doc(db, 'users', userId), {
        profileImageDocId: imageDocId,
        profileImageType: 'firestore',
        updatedAt: new Date()
      });

      const dataUrl = `data:${blob.type || 'image/jpeg'};base64,${base64}`;
      console.log('Profile image uploaded successfully');

      return {
        success: true,
        url: dataUrl,
        storage: 'firestore',
        docId: imageDocId
      };
    } catch (error) {
      console.error('Profile image upload failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Add skill for job seeker
  addSkill: async (userId, skill) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        skills: arrayUnion(skill),
        updatedAt: new Date()
      });
      return { success: true, message: 'Skill added successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Remove skill for job seeker
  removeSkill: async (userId, skill) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        skills: arrayRemove(skill),
        updatedAt: new Date()
      });
      return { success: true, message: 'Skill removed successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Upload resume directly to Firestore
  uploadResume: async (userId, fileUri, fileName, mimeType) => {
    try {
      console.log('Uploading resume to Firestore...');

      const response = await fetch(fileUri);
      const blob = await response.blob();

      // Check file size (warn if over 1MB as base64 will be ~33% larger)
      if (blob.size > 1024 * 1024) {
        console.warn('Large file detected, base64 encoding may impact performance');
      }

      const base64 = await blobToBase64(blob);

      // Generate unique document ID for the resume
      const resumeDocId = `resume_${userId}_${Date.now()}`;

      // Store resume in Firestore uploads collection
      await setDoc(doc(db, 'uploads', resumeDocId), {
        userId,
        fileName,
        folder: 'resumes',
        base64Data: base64,
        storageType: 'firestore',
        uploadedAt: new Date(),
        fileSize: blob.size,
        mimeType: mimeType || blob.type || 'application/pdf'
      });

      // Update user's profile with resume reference
      await updateDoc(doc(db, 'users', userId), {
        resumeDocId: resumeDocId,
        resumeUrl: `data:${mimeType || blob.type || 'application/pdf'};base64,${base64}`,
        resumeFileName: fileName,
        updatedAt: new Date()
      });

      const dataUrl = `data:${mimeType || blob.type || 'application/pdf'};base64,${base64}`;
      console.log('Resume uploaded successfully');

      return {
        success: true,
        url: dataUrl,
        fileName,
        storage: 'firestore',
        docId: resumeDocId
      };
    } catch (error) {
      console.error('Resume upload failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Get skills list
  getSkills: async () => {
    try {
      // Return predefined skills for now
      const skills = [
        'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Swift',
        'Kotlin', 'React', 'Angular', 'Vue.js', 'Node.js', 'Express.js',
        'Django', 'Flask', 'Spring Boot', 'Laravel', 'MySQL', 'PostgreSQL',
        'MongoDB', 'Redis', 'AWS', 'Docker', 'Kubernetes', 'Git', 'HTML',
        'CSS', 'SASS', 'TypeScript', 'React Native', 'Flutter', 'Machine Learning',
        'Data Analysis', 'UI/UX Design', 'Project Management', 'Agile', 'Scrum'
      ];
      return { success: true, data: skills };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get industries list
  getIndustries: async () => {
    try {
      const industries = [
        'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
        'Manufacturing', 'Construction', 'Transportation', 'Hospitality',
        'Real Estate', 'Media & Entertainment', 'Telecommunications',
        'Energy', 'Agriculture', 'Automotive', 'Aerospace', 'Pharmaceuticals',
        'Food & Beverage', 'Consulting', 'Legal Services', 'Non-Profit',
        'Government', 'Other'
      ];
      return { success: true, data: industries };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};