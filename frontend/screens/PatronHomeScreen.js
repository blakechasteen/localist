/**
 * Patron Home Screen
 *
 * Main discovery interface for customers to find local businesses
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

const API_URL = 'http://localhost:8000';

export default function PatronHomeScreen({ navigation }) {
  // State
  const [location, setLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('map');
  const [radiusMiles, setRadiusMiles] = useState(10);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  // Get user location on mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to discover nearby businesses.');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      // Load nearby businesses
      fetchBusinesses('', currentLocation.coords.latitude, currentLocation.coords.longitude);
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Could not get your location');
    }
  };

  // Fetch businesses from API
  const fetchBusinesses = async (query = '', lat = null, lon = null) => {
    setLoading(true);

    try {
      let url = `${API_URL}/api/search?query=${encodeURIComponent(query || 'all businesses')}`;

      if (lat && lon) {
        url += `&lat=${lat}&lon=${lon}&radius_miles=${radiusMiles}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      // Parse business data from HoloLoom memory format
      const parsedBusinesses = data.results.map((result, index) => {
        const lines = result.content.split('\n');
        const business = {
          id: index.toString(),
          name: lines.find(l => l.includes('Business:'))?.split('Business:')[1]?.trim() || 'Unknown',
          category: lines.find(l => l.includes('Category:'))?.split('Category:')[1]?.trim() || 'N/A',
          description: lines.find(l => l.includes('Description:'))?.split('Description:')[1]?.trim() || '',
          address: lines.find(l => l.includes('Address:'))?.split('Address:')[1]?.trim() || '',
          confidence: result.confidence,
        };

        // Extract location
        const locationLine = lines.find(l => l.includes('Location:'));
        if (locationLine) {
          const coords = locationLine.split('Location:')[1].trim().split(',');
          if (coords.length === 2) {
            business.latitude = parseFloat(coords[0]);
            business.longitude = parseFloat(coords[1]);
          }
        }

        return business;
      });

      setBusinesses(parsedBusinesses);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      Alert.alert('Error', 'Could not load businesses. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (location) {
      fetchBusinesses(searchQuery, location.latitude, location.longitude);
    } else {
      fetchBusinesses(searchQuery);
    }
  };

  const handleBusinessPress = (business) => {
    setSelectedBusiness(business);
    // Navigate to business detail screen
    // navigation.navigate('BusinessDetail', { business });
  };

  const renderMarker = (business) => {
    if (!business.latitude || !business.longitude) return null;

    return (
      <Marker
        key={business.id}
        coordinate={{
          latitude: business.latitude,
          longitude: business.longitude,
        }}
        title={business.name}
        description={business.category}
        onPress={() => handleBusinessPress(business)}
      >
        <View style={styles.markerContainer}>
          <View style={styles.marker}>
            <Text style={styles.markerEmoji}>📍</Text>
          </View>
        </View>
      </Marker>
    );
  };

  const renderBusinessItem = ({ item }) => (
    <TouchableOpacity
      style={styles.businessCard}
      onPress={() => handleBusinessPress(item)}
    >
      <View style={styles.businessHeader}>
        <Text style={styles.businessName}>{item.name}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.businessCategory}>{item.category}</Text>
        </View>
      </View>
      <Text style={styles.businessDescription} numberOfLines={2}>
        {item.description}
      </Text>
      {item.address && (
        <Text style={styles.businessAddress}>📍 {item.address}</Text>
      )}
      <View style={styles.cardFooter}>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>
            {(item.confidence * 100).toFixed(0)}% Match
          </Text>
        </View>
        <TouchableOpacity style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>View Details →</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const RadiusSelector = () => (
    <View style={styles.radiusSelector}>
      <Text style={styles.radiusLabel}>Radius:</Text>
      {[5, 10, 25].map((radius) => (
        <TouchableOpacity
          key={radius}
          style={[
            styles.radiusButton,
            radiusMiles === radius && styles.radiusButtonActive
          ]}
          onPress={() => {
            setRadiusMiles(radius);
            if (location) {
              fetchBusinesses(searchQuery, location.latitude, location.longitude);
            }
          }}
        >
          <Text style={[
            styles.radiusButtonText,
            radiusMiles === radius && styles.radiusButtonTextActive
          ]}>
            {radius}mi
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Local</Text>
        <Text style={styles.headerSubtitle}>Find artisans & makers near you</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="artisan coffee, pottery, bakery..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            placeholderTextColor="#9ca3af"
          />
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          <Text style={styles.searchButtonText}>
            {loading ? '...' : 'Search'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Radius Selector */}
      <RadiusSelector />

      {/* View Mode Toggle */}
      <View style={styles.viewModeToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
          onPress={() => setViewMode('map')}
        >
          <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
            🗺️ Map
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
            📋 List
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map or List View */}
      {viewMode === 'map' ? (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={location}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {businesses.map(renderMarker)}
        </MapView>
      ) : (
        <FlatList
          data={businesses}
          renderItem={renderBusinessItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>🔍</Text>
              <Text style={styles.emptyStateText}>
                {loading ? 'Searching...' : 'No businesses found'}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your search or radius
              </Text>
            </View>
          }
        />
      )}

      {/* Results Count Badge */}
      {businesses.length > 0 && (
        <View style={styles.resultsCount}>
          <Text style={styles.resultsCountText}>
            ✨ {businesses.length} {businesses.length === 1 ? 'business' : 'businesses'} nearby
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  searchButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#667eea',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  radiusSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'white',
    gap: 8,
  },
  radiusLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  radiusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  radiusButtonActive: {
    backgroundColor: '#667eea',
  },
  radiusButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  radiusButtonTextActive: {
    color: 'white',
  },
  viewModeToggle: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 12,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#667eea',
  },
  toggleText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: 'white',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerEmoji: {
    fontSize: 24,
  },
  listContainer: {
    padding: 16,
  },
  businessCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  businessCategory: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
  },
  businessDescription: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 22,
  },
  businessAddress: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '600',
  },
  viewDetailsButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  resultsCount: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  resultsCountText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
});
