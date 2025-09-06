import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Logo from '../../app/components/Logo';
import { useAuth } from '../../src/contexts/AuthContext';
import { AuthService } from '../../src/services/authService';
import { validateEmail, validatePassword } from '../../src/utils/validation';

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    userRole: 'jobseeker'
  });
  const [passwordStrength, setPasswordStrength] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Redirect if already logged in and verified
  useEffect(() => {
    if (user) {
      router.replace('/(main)');
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'password') {
      setPasswordStrength(validatePassword(value));
    }
  };

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!validateEmail(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      Alert.alert('Weak Password', passwordValidation.message);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await AuthService.registerWithEmail(
        formData.email, 
        formData.password, 
        formData.userRole
      );
      
      if (result.success) {
        // ✅ Send them to verify-email screen
        router.push({
          pathname: '/(auth)/verify-email',
          params: { email: formData.email, password: formData.password }
        });
      } else {
        Alert.alert('Registration Failed', result.error || 'An unknown error occurred');
      }
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (!formData.password) return '#ddd';
    if (passwordStrength.isValid) return '#4CAF50';
    return '#FF5252';
  };

  // Don't render anything if user exists (will redirect)
  if (user) {
    return null;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Logo size={80} />
        <Text style={styles.title}>Create an Account</Text>
        
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialIcons 
              name={showPassword ? "visibility" : "visibility-off"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
        
        {formData.password.length > 0 && (
          <View style={styles.passwordStrengthContainer}>
            <View 
              style={[
                styles.passwordStrengthBar, 
                { backgroundColor: getPasswordStrengthColor(), width: `${Math.min((formData.password.length / 12) * 100, 100)}%` }
              ]} 
            />
            <Text style={[
              styles.passwordStrengthText,
              { color: getPasswordStrengthColor() }
            ]}>
              {passwordStrength.message || 'Enter a password'}
            </Text>
          </View>
        )}
        
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock-outline" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(text) => handleInputChange('confirmPassword', text)}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <MaterialIcons 
              name={showConfirmPassword ? "visibility" : "visibility-off"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.label}>I am a:</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              formData.userRole === 'jobseeker' && styles.roleButtonSelected
            ]}
            onPress={() => handleInputChange('userRole', 'jobseeker')}
          >
            <MaterialIcons 
              name="person" 
              size={20} 
              color={formData.userRole === 'jobseeker' ? 'white' : '#666'} 
            />
            <Text style={[
              styles.roleText,
              formData.userRole === 'jobseeker' && styles.roleTextSelected
            ]}>
              Job Seeker
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.roleButton,
              formData.userRole === 'employer' && styles.roleButtonSelected
            ]}
            onPress={() => handleInputChange('userRole', 'employer')}
          >
            <MaterialIcons 
              name="business" 
              size={20} 
              color={formData.userRole === 'employer' ? 'white' : '#666'} 
            />
            <Text style={[
              styles.roleText,
              formData.userRole === 'employer' && styles.roleTextSelected
            ]}>
              Employer
            </Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.link}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#2c3e50',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
  },
  passwordStrengthContainer: {
    marginBottom: 15,
  },
  passwordStrengthBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 5,
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  label: {
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginHorizontal: 5,
    backgroundColor: '#f9f9f9',
  },
  roleButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  roleText: {
    marginLeft: 5,
    color: '#666',
    fontWeight: '500',
  },
  roleTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  footerText: {
    color: '#7f8c8d',
  },
  link: {
    color: '#3498db',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;