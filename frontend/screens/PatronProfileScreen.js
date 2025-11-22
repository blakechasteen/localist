/**
 * Patron Profile Screen
 *
 * Customer profile with favorites, history, and settings
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';

export default function PatronProfileScreen({ navigation }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  // Mock user data
  const userData = {
    name: 'Sarah Johnson',
    email: 'sarah@email.com',
    memberSince: 'March 2025',
    stats: {
      favorites: 12,
      visited: 28,
      reviews: 8,
    },
    favorites: [
      { id: '1', name: 'Third Wave Coffee', category: 'Coffee Shop', distance: '0.5 mi' },
      { id: '2', name: 'Pottery Paradise', category: 'Art Studio', distance: '1.2 mi' },
      { id: '3', name: 'Heritage Bakery', category: 'Bakery', distance: '0.8 mi' },
    ],
    recentVisits: [
      { id: '1', name: 'Third Wave Coffee', date: '2 days ago', category: 'Coffee Shop' },
      { id: '2', name: 'Local Honey Collective', date: '1 week ago', category: 'Food Artisan' },
      { id: '3', name: 'Woodcraft Studios', date: '2 weeks ago', category: 'Woodworking' },
    ],
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {
          // TODO: Clear auth token
          // navigation.navigate('Login');
        }},
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userData.name.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{userData.name}</Text>
        <Text style={styles.email}>{userData.email}</Text>
        <Text style={styles.memberSince}>Member since {userData.memberSince}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userData.stats.favorites}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userData.stats.visited}</Text>
          <Text style={styles.statLabel}>Visited</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userData.stats.reviews}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
      </View>

      {/* Favorites */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>❤️ Favorite Businesses</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All →</Text>
          </TouchableOpacity>
        </View>
        {userData.favorites.map((business) => (
          <TouchableOpacity
            key={business.id}
            style={styles.businessItem}
            onPress={() => navigation.navigate('BusinessDetail', { business })}
          >
            <View style={styles.businessIcon}>
              <Text style={styles.businessEmoji}>📍</Text>
            </View>
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>{business.name}</Text>
              <Text style={styles.businessCategory}>{business.category}</Text>
            </View>
            <Text style={styles.businessDistance}>{business.distance}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Visits */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🕐 Recent Visits</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All →</Text>
          </TouchableOpacity>
        </View>
        {userData.recentVisits.map((visit) => (
          <TouchableOpacity
            key={visit.id}
            style={styles.businessItem}
            onPress={() => navigation.navigate('BusinessDetail', { business: visit })}
          >
            <View style={styles.businessIcon}>
              <Text style={styles.businessEmoji}>✓</Text>
            </View>
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>{visit.name}</Text>
              <Text style={styles.businessCategory}>{visit.category}</Text>
            </View>
            <Text style={styles.visitDate}>{visit.date}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Settings</Text>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingSubtext}>New messages & updates</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#d1d5db', true: '#667eea' }}
            thumbColor={'white'}
          />
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Location Services</Text>
            <Text style={styles.settingSubtext}>Find nearby businesses</Text>
          </View>
          <Switch
            value={locationEnabled}
            onValueChange={setLocationEnabled}
            trackColor={{ false: '#d1d5db', true: '#667eea' }}
            thumbColor={'white'}
          />
        </View>

        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingButtonIcon}>👤</Text>
          <Text style={styles.settingButtonText}>Edit Profile</Text>
          <Text style={styles.settingButtonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingButtonIcon}>🔔</Text>
          <Text style={styles.settingButtonText}>Notification Preferences</Text>
          <Text style={styles.settingButtonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingButtonIcon}>🔒</Text>
          <Text style={styles.settingButtonText}>Privacy & Security</Text>
          <Text style={styles.settingButtonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingButtonIcon}>❓</Text>
          <Text style={styles.settingButtonText}>Help & Support</Text>
          <Text style={styles.settingButtonArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingButtonIcon}>📄</Text>
          <Text style={styles.settingButtonText}>Terms & Privacy Policy</Text>
          <Text style={styles.settingButtonArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Localist v0.1.0</Text>
        <Text style={styles.footerSubtext}>Supporting local businesses since 2025</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 32,
    paddingTop: 80,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#667eea',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  memberSince: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  businessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  businessIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  businessEmoji: {
    fontSize: 20,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  businessCategory: {
    fontSize: 13,
    color: '#6b7280',
  },
  businessDistance: {
    fontSize: 13,
    color: '#9ca3af',
  },
  visitDate: {
    fontSize: 13,
    color: '#9ca3af',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingSubtext: {
    fontSize: 13,
    color: '#6b7280',
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingButtonIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
  },
  settingButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
  },
  settingButtonArrow: {
    fontSize: 18,
    color: '#9ca3af',
  },
  logoutButton: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
