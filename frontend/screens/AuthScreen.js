/**
 * Authentication Screen
 *
 * Combined login/signup screen
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState('patron'); // 'patron' or 'vendor'

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      // TODO: API call for login/signup
      if (isLogin) {
        // Login
        if (userType === 'vendor') {
          navigation.replace('VendorDashboard');
        } else {
          navigation.replace('PatronHome');
        }
      } else {
        // Signup
        Alert.alert('Success', 'Account created! Please login.');
        setIsLogin(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Authentication failed');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Localist</Text>
        <Text style={styles.tagline}>Discover & Support Local Businesses</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* User Type Toggle */}
        <View style={styles.userTypeToggle}>
          <TouchableOpacity
            style={[styles.userTypeButton, userType === 'patron' && styles.userTypeButtonActive]}
            onPress={() => setUserType('patron')}
          >
            <Text style={[styles.userTypeText, userType === 'patron' && styles.userTypeTextActive]}>
              I'm a Customer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.userTypeButton, userType === 'vendor' && styles.userTypeButtonActive]}
            onPress={() => setUserType('vendor')}
          >
            <Text style={[styles.userTypeText, userType === 'vendor' && styles.userTypeTextActive]}>
              I'm a Business
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Fields */}
        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholderTextColor="#9ca3af"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#9ca3af"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#9ca3af"
        />

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>
            {isLogin ? 'Login' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        {/* Toggle Login/Signup */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.toggleText}>
            {isLogin ? 'Don\'t have an account? ' : 'Already have an account? '}
            <Text style={styles.toggleTextBold}>
              {isLogin ? 'Sign Up' : 'Login'}
            </Text>
          </Text>
        </TouchableOpacity>

        {/* Vendor Signup Link */}
        {isLogin && userType === 'vendor' && (
          <TouchableOpacity
            style={styles.vendorSignupLink}
            onPress={() => navigation.navigate('VendorSignup')}
          >
            <Text style={styles.vendorSignupText}>
              New business? Join Localist →
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        By continuing, you agree to our Terms & Privacy Policy
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 40,
    paddingTop: 100,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  form: {
    flex: 1,
    padding: 24,
  },
  userTypeToggle: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  userTypeButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
  },
  userTypeButtonActive: {
    backgroundColor: '#667eea',
  },
  userTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  userTypeTextActive: {
    color: 'white',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: '#6b7280',
  },
  toggleTextBold: {
    fontWeight: '600',
    color: '#667eea',
  },
  vendorSignupLink: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ede9fe',
    borderRadius: 8,
  },
  vendorSignupText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },
  footer: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    padding: 24,
  },
});
