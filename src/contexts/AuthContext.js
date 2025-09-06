// src/contexts/AuthContext.js
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        // Check if email is verified
        await authUser.reload();
        const emailVerified = authUser.emailVerified;
        
        if (!emailVerified) {
          // If not verified, sign out immediately
          try {
            await auth.signOut();
            setUser(null);
            setUserData(null);
            setIsVerified(false);
            setLoading(false);
            return;
          } catch (error) {
            console.error('Error signing out unverified user:', error);
          }
        }

        setUser(authUser);
        setIsVerified(emailVerified);
        
        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));

          if (userDoc.exists()) {
            const fetchedUserData = userDoc.data();
            setUserData(fetchedUserData);

            // Update Firestore if email verification status changed
            if (fetchedUserData.emailVerified !== emailVerified) {
              await updateDoc(doc(db, 'users', authUser.uid), {
                emailVerified: emailVerified
              });
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        setUserData(null);
        setIsVerified(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setUserData(null);
      setIsVerified(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    userData,
    loading,
    isVerified,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};