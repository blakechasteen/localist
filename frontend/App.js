/**
 * Localist Mobile App
 *
 * React Native app for discovering local businesses.
 *
 * Author: Blake Chasteen
 * Date: November 8, 2025
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
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

// Configuration
const API_URL = 'http://localhost:8000';  // Change for production

export default function App() {
  // State
  const [location, setLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('map');  // 'map' or 'list'

  // Get user location on mount
  useEffect(() => {
    (async () => {
      // Request permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to discover nearby businesses.');
        return;
      }

      // Get current location
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      // Load nearby businesses
      fetchBusinesses('', currentLocation.coords.latitude, currentLocation.coords.longitude);
    })();
  }, []);

  // Fetch businesses from API
  const fetchBusinesses = async (query = '', lat = null, lon = null) => {
    setLoading(true);

    try {
      let url = `${API_URL}/api/search?query=${encodeURIComponent(query || 'all businesses')}`;

      if (lat && lon) {
        url += `&lat=${lat}&lon=${lon}&radius_miles=10`;
      }

      const response = await fetch(url);
      const data = await response.json();

      // Parse business data from HoloLoom memory format
      const parsedBusinesses = data.results.map((result, index) => {
        // Extract business details from content string
        // Format: "Business: Name\nCategory: category\nDescription: desc\nLocation: lat, lon"
        const lines = result.content.split('\n');
        const business = {
          id: index.toString(),
          name: lines.find(l => l.includes('Business:'))?.split('Business:')[1]?.trim() || 'Unknown',
          category: lines.find(l => l.includes('Category:'))?.split('Category:')[1]?.trim() || 'N/A',
          description: lines.find(l => l.includes('Description:'))?.split('Description:')[1]?.trim() || '',
          address: lines.find(l => l.includes('Address:'))?.split('Address:')[1]?.trim() || '',
          confidence: result.confidence,
        };

        // Extract location if available
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

  // Handle search
  const handleSearch = () => {
    if (location) {
      fetchBusinesses(searchQuery, location.latitude, location.longitude);
    } else {
      fetchBusinesses(searchQuery);
    }
  };

  // Render business marker on map
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
      />
    );
  };

  // Render business list item
  const renderBusinessItem = ({ item }) => (
    <TouchableOpacity style={styles.businessCard}>
      <View style={styles.businessHeader}>
        <Text style={styles.businessName}>{item.name}</Text>
        <Text style={styles.businessCategory}>{item.category}</Text>
      </View>
      <Text style={styles.businessDescription} numberOfLines={2}>
        {item.description}
      </Text>
      {item.address && (
        <Text style={styles.businessAddress}>{item.address}</Text>
      )}
      <View style={styles.confidenceBadge}>
        <Text style={styles.confidenceText}>
          Match: {(item.confidence * 100).toFixed(0)}%
        </Text>
      </View>
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Localist</Text>
        <Text style={styles.headerSubtitle}>Discover Local Businesses</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for artisan coffee, pottery, etc."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          <Text style={styles.searchButtonText}>
            {loading ? '...' : '🔍'}
          </Text>
        </TouchableOpacity>
      </View>

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
              <Text style={styles.emptyStateText}>
                {loading ? 'Searching...' : 'No businesses found. Try a different search!'}
              </Text>
            </View>
          }
        />
      )}

      {/* Results Count */}
      {businesses.length > 0 && (
        <View style={styles.resultsCount}>
          <Text style={styles.resultsCountText}>
            Found {businesses.length} {businesses.length === 1 ? 'business' : 'businesses'}
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
    color: '#4a5568',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    fontSize: 16,
  },
  searchButton: {
    marginLeft: 10,
    padding: 12,
    backgroundColor: '#667eea',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  searchButtonText: {
    fontSize: 20,
  },
  viewModeToggle: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#667eea',
  },
  toggleText: {
    fontSize: 16,
    color: '#4a5568',
  },
  toggleTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  businessCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    flex: 1,
  },
  businessCategory: {
    fontSize: 12,
    color: '#667eea',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  businessDescription: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 8,
    lineHeight: 20,
  },
  businessAddress: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 8,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
  },
  resultsCount: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  resultsCountText: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '600',
  },
});
