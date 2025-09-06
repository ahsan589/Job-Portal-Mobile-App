// src/services/authService.js
import {
  applyActionCode,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const AuthService = {
  // Email/password registration with immediate sign-out
  registerWithEmail: async (email, password, userRole, additionalData = {}) => {
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        email, 
        password
      );
      
      // Send verification email immediately
      await sendEmailVerification(userCredential.user);
      
      // Store user data in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        role: userRole,
        emailVerified: false,
        createdAt: new Date(),
        ...additionalData
      });
      
      // SIGN OUT IMMEDIATELY after registration
      await signOut(auth);
      
      return { 
        success: true, 
        message: 'Verification email sent. Please check your inbox and verify your email before logging in.'
      };
    } catch (error) {
      // If any error occurs, make sure to sign out
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error('Sign out error:', signOutError);
      }
      return { success: false, error: error.message };
    }
  },

  // Strict email verification check during login
  loginWithEmail: async (email, password, expectedRole = null) => {
    try {
      // First sign in to check verification status
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email, 
        password
      );
      
      // Check if email is verified - STRICT CHECK
      if (!userCredential.user.emailVerified) {
        // Sign out immediately if not verified
        await signOut(auth);
        return { 
          success: false, 
          error: 'Email not verified. Please check your inbox and verify your email before logging in.' 
        };
      }
      
      // Double-check with Firestore data
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.emailVerified === false) {
          await signOut(auth);
          return { 
            success: false, 
            error: 'Email verification pending. Please verify your email.' 
          };
        }
        if (expectedRole && userData.role !== expectedRole) {
          await signOut(auth);
          return {
            success: false,
            error: `User role mismatch. Expected role: ${expectedRole}.`
          };
        }
      } else {
        await signOut(auth);
        return {
          success: false,
          error: 'User data not found.'
        };
      }
      
      return { success: true, user: userCredential.user, userData: userDoc.data() };
    } catch (error) {
      // Sign out on any error
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error('Sign out error:', signOutError);
      }
      return { success: false, error: error.message };
    }
  },

  // Resend verification email
  resendVerificationEmail: async (email, password) => {
    try {
      let userToSendEmail;

      // Check if user is already logged in and not verified
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        userToSendEmail = auth.currentUser;
      } else {
        // Sign in to get user reference
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        userToSendEmail = userCredential.user;

        // Sign out immediately if we signed in
        await signOut(auth);
      }

      // Send verification email
      await sendEmailVerification(userToSendEmail);

      return { success: true, message: 'Verification email sent.' };
    } catch (error) {
      // Sign out on error if we signed in
      try {
        if (auth.currentUser) {
          await signOut(auth);
        }
      } catch (signOutError) {
        console.error('Sign out error:', signOutError);
      }
      return { success: false, error: error.message };
    }
  },

  // Verify email with action code
  verifyEmail: async (actionCode) => {
    try {
      await applyActionCode(auth, actionCode);

      // Ensure currentUser is updated after verification
      if (auth.currentUser) {
        await auth.currentUser.reload();
        const uid = auth.currentUser.uid;

        // Update Firestore to mark email as verified
        await setDoc(doc(db, 'users', uid), {
          emailVerified: true
        }, { merge: true });
      } else {
        // If currentUser is not set, try to get user from action code info
        // Note: Firebase doesn't provide direct way to get uid from action code
        // This is a fallback, but ideally currentUser should be set
        console.warn('auth.currentUser not set after applyActionCode');
      }

      return { success: true, message: 'Email verified successfully.' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Logout
  logout: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Password reset
  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent.' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Check if user is verified
  checkEmailVerified: async () => {
    try {
      await auth.currentUser?.reload();
      return auth.currentUser?.emailVerified || false;
    } catch (error) {
      return false;
    }
  }
};