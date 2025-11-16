/**
 * App Navigation Structure
 *
 * React Navigation setup for the entire app
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Auth Screens
import AuthScreen from '../screens/AuthScreen';

// Patron Screens
import PatronHomeScreen from '../screens/PatronHomeScreen';
import BusinessDetailScreen from '../screens/BusinessDetailScreen';
import PatronMessagesScreen from '../screens/PatronMessagesScreen';
import PatronProfileScreen from '../screens/PatronProfileScreen';

// Vendor Screens
import VendorSignupScreen from '../screens/VendorSignupScreen';
import VendorDashboardScreen from '../screens/VendorDashboardScreen';
import VendorMessagesScreen from '../screens/VendorMessagesScreen';
import VendorSettingsScreen from '../screens/VendorSettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Patron Bottom Tabs
function PatronTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tab.Screen
        name="Discover"
        component={PatronHomeScreen}
        options={{ tabBarIcon: () => '🗺️' }}
      />
      <Tab.Screen
        name="Messages"
        component={PatronMessagesScreen}
        options={{ tabBarIcon: () => '💬' }}
      />
      <Tab.Screen
        name="Profile"
        component={PatronProfileScreen}
        options={{ tabBarIcon: () => '👤' }}
      />
    </Tab.Navigator>
  );
}

// Vendor Bottom Tabs
function VendorTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={VendorDashboardScreen}
        options={{ tabBarIcon: () => '📊' }}
      />
      <Tab.Screen
        name="Messages"
        component={VendorMessagesScreen}
        options={{ tabBarIcon: () => '💬' }}
      />
      <Tab.Screen
        name="Settings"
        component={VendorSettingsScreen}
        options={{ tabBarIcon: () => '⚙️' }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Auth Flow */}
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="VendorSignup" component={VendorSignupScreen} />

        {/* Patron Flow */}
        <Stack.Screen name="PatronHome" component={PatronTabs} />
        <Stack.Screen name="BusinessDetail" component={BusinessDetailScreen} />

        {/* Vendor Flow */}
        <Stack.Screen name="VendorDashboard" component={VendorTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
