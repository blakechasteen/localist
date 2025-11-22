/**
 * Business Detail Screen
 *
 * Full business profile view for patrons
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width } = Dimensions.get('window');
const API_URL = 'http://localhost:8000';

export default function BusinessDetailScreen({ route, navigation }) {
  const { business } = route.params;

  const [activeTab, setActiveTab] = useState('about'); // about, products, reviews
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Mock data (replace with API call)
  const businessData = {
    id: business?.id || '1',
    name: business?.name || 'Third Wave Coffee',
    category: business?.category || 'Coffee Shop',
    description: business?.description || 'Artisan coffee roasters with outdoor seating and fresh pastries. We source our beans directly from small farms and roast them in-house every week.',
    address: business?.address || '123 Main St, San Francisco, CA 94102',
    phone: '(415) 555-0123',
    website: 'https://thirdwavecoffee.com',
    email: 'hello@thirdwavecoffee.com',
    latitude: business?.latitude || 37.7749,
    longitude: business?.longitude || -122.4194,

    // Stats
    rating: 4.8,
    reviewCount: 127,
    favorites: 342,
    verified: true,

    // Hours
    hours: {
      monday: '7:00 AM - 6:00 PM',
      tuesday: '7:00 AM - 6:00 PM',
      wednesday: '7:00 AM - 6:00 PM',
      thursday: '7:00 AM - 6:00 PM',
      friday: '7:00 AM - 8:00 PM',
      saturday: '8:00 AM - 8:00 PM',
      sunday: '8:00 AM - 6:00 PM',
    },
    currentlyOpen: true,

    // Photos
    photos: [
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800',
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    ],

    // Products
    products: [
      { id: '1', name: 'House Blend', price: 16.99, description: 'Our signature medium roast', image: '☕' },
      { id: '2', name: 'Single Origin Ethiopia', price: 19.99, description: 'Bright and fruity notes', image: '☕' },
      { id: '3', name: 'Espresso Roast', price: 18.99, description: 'Bold and smooth', image: '☕' },
      { id: '4', name: 'Croissant', price: 4.50, description: 'Buttery and flaky', image: '🥐' },
    ],

    // Reviews
    reviews: [
      {
        id: '1',
        userName: 'Sarah M.',
        rating: 5,
        date: '2 days ago',
        text: 'Best coffee in the city! The baristas really know their craft.',
        verified: true,
      },
      {
        id: '2',
        userName: 'Mike R.',
        rating: 5,
        date: '1 week ago',
        text: 'Love the outdoor seating area. Great place to work remotely.',
        verified: true,
      },
      {
        id: '3',
        userName: 'Jennifer L.',
        rating: 4,
        date: '2 weeks ago',
        text: 'Excellent coffee, though sometimes there\'s a wait during peak hours.',
        verified: true,
      },
    ],

    // Bulletin
    latestBulletin: {
      content: '🎉 New seasonal blend available! Try our Autumn Harvest roast - notes of cinnamon and caramel. Limited time only!',
      timestamp: '2 days ago',
    },
  };

  const handleCall = () => {
    Linking.openURL(`tel:${businessData.phone}`);
  };

  const handleDirections = () => {
    const url = `https://maps.google.com/?q=${businessData.latitude},${businessData.longitude}`;
    Linking.openURL(url);
  };

  const handleWebsite = () => {
    Linking.openURL(businessData.website);
  };

  const handleMessage = () => {
    navigation.navigate('PatronMessages', { business: businessData });
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: API call to save favorite
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Text key={`star-${i}`} style={styles.star}>⭐</Text>);
    }
    if (hasHalfStar) {
      stars.push(<Text key="half-star" style={styles.star}>⭐</Text>);
    }

    return stars;
  };

  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.descriptionText}>{businessData.description}</Text>
      </View>

      {/* Latest Bulletin */}
      {businessData.latestBulletin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's New</Text>
          <View style={styles.bulletinCard}>
            <Text style={styles.bulletinText}>{businessData.latestBulletin.content}</Text>
            <Text style={styles.bulletinTimestamp}>{businessData.latestBulletin.timestamp}</Text>
          </View>
        </View>
      )}

      {/* Hours */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hours</Text>
          {businessData.currentlyOpen && (
            <View style={styles.openBadge}>
              <View style={styles.openDot} />
              <Text style={styles.openText}>Open Now</Text>
            </View>
          )}
        </View>
        {Object.entries(businessData.hours).map(([day, hours]) => (
          <View key={day} style={styles.hoursRow}>
            <Text style={styles.dayText}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
            <Text style={styles.hoursText}>{hours}</Text>
          </View>
        ))}
      </View>

      {/* Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>
        <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
          <Text style={styles.contactIcon}>📞</Text>
          <Text style={styles.contactText}>{businessData.phone}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactRow} onPress={handleWebsite}>
          <Text style={styles.contactIcon}>🌐</Text>
          <Text style={styles.contactText}>{businessData.website}</Text>
        </TouchableOpacity>
        <View style={styles.contactRow}>
          <Text style={styles.contactIcon}>📧</Text>
          <Text style={styles.contactText}>{businessData.email}</Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.addressText}>{businessData.address}</Text>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: businessData.latitude,
              longitude: businessData.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: businessData.latitude,
                longitude: businessData.longitude,
              }}
              title={businessData.name}
            />
          </MapView>
          <TouchableOpacity style={styles.directionsOverlay} onPress={handleDirections}>
            <Text style={styles.directionsText}>Get Directions →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderProductsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Products & Services</Text>
        {businessData.products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <Text style={styles.productEmoji}>{product.image}</Text>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDescription}>{product.description}</Text>
            </View>
            <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderReviewsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews ({businessData.reviewCount})</Text>

        {/* Rating Summary */}
        <View style={styles.ratingSummary}>
          <Text style={styles.ratingNumber}>{businessData.rating.toFixed(1)}</Text>
          <View>
            <View style={styles.starsRow}>
              {renderStars(businessData.rating)}
            </View>
            <Text style={styles.reviewCountText}>{businessData.reviewCount} reviews</Text>
          </View>
        </View>

        {/* Individual Reviews */}
        {businessData.reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewAvatar}>
                <Text style={styles.reviewAvatarText}>{review.userName.charAt(0)}</Text>
              </View>
              <View style={styles.reviewHeaderText}>
                <View style={styles.reviewNameRow}>
                  <Text style={styles.reviewUserName}>{review.userName}</Text>
                  {review.verified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓ Verified</Text>
                    </View>
                  )}
                </View>
                <View style={styles.starsRow}>
                  {renderStars(review.rating)}
                  <Text style={styles.reviewDate}> • {review.date}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.reviewText}>{review.text}</Text>
          </View>
        ))}

        {/* Write Review Button */}
        <TouchableOpacity style={styles.writeReviewButton}>
          <Text style={styles.writeReviewButtonText}>✍️ Write a Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Image Gallery */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentImageIndex(index);
        }}
        scrollEventThrottle={16}
      >
        {businessData.photos.map((photo, index) => (
          <Image
            key={index}
            source={{ uri: photo }}
            style={styles.headerImage}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {/* Photo Indicators */}
      <View style={styles.photoIndicators}>
        {businessData.photos.map((_, index) => (
          <View
            key={index}
            style={[
              styles.photoIndicator,
              index === currentImageIndex && styles.photoIndicatorActive
            ]}
          />
        ))}
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={toggleFavorite}
        >
          <Text style={styles.headerActionIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={handleShare}
        >
          <Text style={styles.headerActionIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Business Header */}
        <View style={styles.businessHeader}>
          <View style={styles.businessHeaderTop}>
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>{businessData.name}</Text>
              <View style={styles.categoryRow}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{businessData.category}</Text>
                </View>
                {businessData.verified && (
                  <View style={styles.verifiedBusinessBadge}>
                    <Text style={styles.verifiedBusinessText}>✓ Verified</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.starsRow}>
                {renderStars(businessData.rating)}
              </View>
              <Text style={styles.statText}>{businessData.rating.toFixed(1)} ({businessData.reviewCount})</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>❤️ {businessData.favorites}</Text>
              <Text style={styles.statText}>Favorites</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.tabActive]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>
              About
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'products' && styles.tabActive]}
            onPress={() => setActiveTab('products')}
          >
            <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
              Products
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
              Reviews
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'about' && renderAboutTab()}
        {activeTab === 'products' && renderProductsTab()}
        {activeTab === 'reviews' && renderReviewsTab()}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.bottomButton, styles.bottomButtonSecondary]}
          onPress={handleCall}
        >
          <Text style={styles.bottomButtonText}>📞 Call</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomButton, styles.bottomButtonPrimary]}
          onPress={handleMessage}
        >
          <Text style={[styles.bottomButtonText, styles.bottomButtonTextPrimary]}>
            💬 Message
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomButton, styles.bottomButtonSecondary]}
          onPress={handleDirections}
        >
          <Text style={styles.bottomButtonText}>🗺️ Directions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerImage: {
    width: width,
    height: 280,
    backgroundColor: '#e5e7eb',
  },
  photoIndicators: {
    position: 'absolute',
    top: 260,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  photoIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  photoIndicatorActive: {
    backgroundColor: 'white',
    width: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  businessHeader: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  businessHeaderTop: {
    marginBottom: 16,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '600',
  },
  verifiedBusinessBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifiedBusinessText: {
    fontSize: 14,
    color: '#065f46',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  star: {
    fontSize: 16,
  },
  statText: {
    fontSize: 13,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#667eea',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#667eea',
  },
  tabContent: {
    paddingBottom: 100,
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
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 24,
  },
  bulletinCard: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  bulletinText: {
    fontSize: 15,
    color: '#78350f',
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletinTimestamp: {
    fontSize: 12,
    color: '#92400e',
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  openText: {
    fontSize: 14,
    color: '#065f46',
    fontWeight: '600',
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dayText: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  hoursText: {
    fontSize: 15,
    color: '#6b7280',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  contactIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
  },
  contactText: {
    fontSize: 15,
    color: '#667eea',
    flex: 1,
  },
  addressText: {
    fontSize: 15,
    color: '#4b5563',
    marginBottom: 12,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  directionsOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  directionsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
  },
  productEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 20,
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
    marginRight: 20,
  },
  reviewCountText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  reviewCard: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reviewAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  reviewHeaderText: {
    flex: 1,
  },
  reviewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewUserName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  verifiedBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: 13,
    color: '#9ca3af',
  },
  reviewText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  writeReviewButton: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  writeReviewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  bottomButtonPrimary: {
    backgroundColor: '#667eea',
  },
  bottomButtonSecondary: {
    backgroundColor: '#f3f4f6',
  },
  bottomButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  bottomButtonTextPrimary: {
    color: 'white',
  },
});
