/**
 * Vendor Signup Screen
 *
 * Business onboarding flow with verification
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const API_URL = 'http://localhost:8000';

export default function VendorSignupScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1: Business Info, 2: Location, 3: Verification

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [taxId, setTaxId] = useState('');

  // Location state
  const [location, setLocation] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
  });

  const categories = [
    'Coffee Shop',
    'Bakery',
    'Art Studio',
    'Woodworking',
    'Pottery',
    'Food Artisan',
    'Jewelry',
    'Clothing',
    'Restaurant',
    'Other',
  ];

  const handleNext = () => {
    if (step === 1) {
      if (!businessName || !category || !description) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!address || !phone || !email) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!taxId) {
      Alert.alert('Error', 'Please enter your Tax ID/EIN');
      return;
    }

    try {
      // TODO: Replace with actual API call
      Alert.alert(
        'Success',
        'Your business has been submitted for verification. We\'ll review it within 24 hours.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('VendorDashboard'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Could not submit business. Please try again.');
    }
  };

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Business Information</Text>
      <Text style={styles.stepSubtitle}>Tell us about your business</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Business Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Third Wave Coffee"
          value={businessName}
          onChangeText={setBusinessName}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                category === cat && styles.categoryChipActive
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[
                styles.categoryChipText,
                category === cat && styles.categoryChipTextActive
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe what makes your business special..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={250}
          placeholderTextColor="#9ca3af"
        />
        <Text style={styles.charCount}>{description.length}/250</Text>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Location & Contact</Text>
      <Text style={styles.stepSubtitle}>How can customers reach you?</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="123 Main St, San Francisco, CA"
          value={address}
          onChangeText={setAddress}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.mapPreview}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={{
            ...location,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={location} />
        </MapView>
        <TouchableOpacity style={styles.adjustLocationButton}>
          <Text style={styles.adjustLocationText}>📍 Adjust Pin Location</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone *</Text>
        <TextInput
          style={styles.input}
          placeholder="(415) 555-0123"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="hello@yourbusiness.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Website (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="https://yourbusiness.com"
          value={website}
          onChangeText={setWebsite}
          keyboardType="url"
          autoCapitalize="none"
          placeholderTextColor="#9ca3af"
        />
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Verification</Text>
      <Text style={styles.stepSubtitle}>We verify all businesses to maintain quality</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>🛡️</Text>
        <Text style={styles.infoText}>
          Localist only features verified local businesses. This helps customers trust your business and prevents corporate chains from infiltrating the platform.
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Tax ID / EIN *</Text>
        <TextInput
          style={styles.input}
          placeholder="XX-XXXXXXX"
          value={taxId}
          onChangeText={setTaxId}
          keyboardType="number-pad"
          secureTextEntry
          placeholderTextColor="#9ca3af"
        />
        <Text style={styles.helpText}>
          Your Tax ID is encrypted and used only for verification. We never share this information.
        </Text>
      </View>

      <View style={styles.verificationSteps}>
        <Text style={styles.verificationTitle}>What happens next?</Text>
        <View style={styles.verificationStep}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>We verify your Tax ID with public records</Text>
        </View>
        <View style={styles.verificationStep}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>Review typically takes 12-24 hours</Text>
        </View>
        <View style={styles.verificationStep}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>You'll receive an email when approved</Text>
        </View>
        <View style={styles.verificationStep}>
          <Text style={styles.stepNumber}>4</Text>
          <Text style={styles.stepText}>Start connecting with local customers!</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Localist</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {step} of 3</Text>
      </View>

      {/* Step Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      {/* Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {step === 3 ? 'Submit for Verification' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 28,
    color: '#667eea',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerRight: {
    width: 40,
  },
  progressContainer: {
    padding: 20,
    backgroundColor: 'white',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
  },
  progressText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  stepContent: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1f2937',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: 'white',
  },
  mapPreview: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  adjustLocationButton: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  adjustLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  verificationSteps: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginTop: 12,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  verificationStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: 12,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  nextButton: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
