// app/(auth)/verify-email.js
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { AuthService } from '../../src/services/authService';

const VerifyEmailScreen = () => {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState(params.email || '');
  const [password, setPassword] = useState(params.password || '');
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  useEffect(() => {
    if (!email) {
      Alert.alert('Error', 'Email not provided');
      router.back();
    }

    // 🔹 Check if user is already logged in and verified
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        setAlreadyVerified(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleResendEmail = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Cannot resend verification without email and password');
      return;
    }

    setResendLoading(true);
    const result = await AuthService.resendVerificationEmail(email, password);
    setResendLoading(false);

    if (result.success) {
      Alert.alert('Success', result.message);
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleOpenEmailApp = () => {
    Linking.openURL('mailto:'); // ✅ use mailto for better cross-platform support
  };

  const handleTryLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your credentials to check verification');
      router.push('/(auth)/login');
      return;
    }

    setLoading(true);
    const result = await AuthService.loginWithEmail(email, password);
    setLoading(false);

    if (result.success) {
      if (result.user?.emailVerified) {
        Alert.alert('Verified', 'Your email is verified. Please log in.');
        router.replace('/(auth)/login'); // ✅ go to login, not main
      } else {
        Alert.alert('Not Verified', 'Please verify your email before logging in.');
      }
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/logo.png')} style={styles.image} />

      <Text style={styles.title}>Verify Your Email</Text>

      {alreadyVerified ? (
        <Text style={[styles.message, { color: '#2ecc71' }]}>
          ✅ Your email is already verified! Please go back and login.
        </Text>
      ) : (
        <>
          <Text style={styles.message}>
            We've sent a verification email to {email}.
            Please check your inbox and click the verification link.
          </Text>

          <Text style={styles.note}>
            📧 Can't find the email? Check your spam folder!
          </Text>
        </>
      )}

      {!alreadyVerified && (
        <>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleOpenEmailApp}
          >
            <MaterialIcons name="email" size={20} color="white" />
            <Text style={styles.buttonText}>Open Email App</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleResendEmail}
            disabled={resendLoading}
          >
            {resendLoading ? (
              <ActivityIndicator size="small" color="#3498db" />
            ) : (
              <MaterialIcons name="refresh" size={20} color="#3498db" />
            )}
            <Text style={[styles.buttonText, { color: '#3498db' }]}>
              {resendLoading ? 'Sending...' : 'Resend Verification'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={[styles.button, styles.tertiaryButton]}
        onPress={handleTryLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#2ecc71" />
        ) : (
          <MaterialIcons name="check-circle" size={20} color="#2ecc71" />
        )}
        <Text style={[styles.buttonText, { color: '#2ecc71' }]}>
          {loading ? 'Checking...' : "I've Verified My Email"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.backText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default VerifyEmailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  image: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 20
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333'
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    color: '#666'
  },
  note: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#999'
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 6,
    width: '100%',
    justifyContent: 'center'
  },
  primaryButton: {
    backgroundColor: '#3498db'
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#3498db',
    backgroundColor: '#fff'
  },
  tertiaryButton: {
    borderWidth: 1,
    borderColor: '#2ecc71',
    backgroundColor: '#fff'
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500'
  },
  backText: {
    marginTop: 16,
    fontSize: 14,
    color: '#3498db'
  }
});
