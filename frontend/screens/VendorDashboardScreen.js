/**
 * Vendor Dashboard Screen
 *
 * Business owner interface to manage their listing, products, and bulletin posts
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';

const API_URL = 'http://localhost:8000';

export default function VendorDashboardScreen({ route, navigation }) {
  const { businessId } = route.params || { businessId: null };

  // State
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, bulletin, products, analytics

  // Bulletin post state
  const [bulletinText, setBulletinText] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Business hours state
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    loadBusinessData();
  }, [businessId]);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`${API_URL}/api/businesses/${businessId}`);
      // const data = await response.json();

      // Mock data for now
      setBusiness({
        id: businessId || '1',
        name: 'Third Wave Coffee',
        category: 'Coffee Shop',
        description: 'Artisan coffee roasters with outdoor seating',
        address: '123 Main St, San Francisco, CA',
        verified: true,
        views: 342,
        messages: 12,
        favorites: 28,
        rating: 4.8,
        reviewCount: 15,
        bulletinPosts: [
          {
            id: '1',
            content: 'New seasonal blend available! Try our Autumn Harvest roast.',
            timestamp: '2 days ago',
          },
        ],
        products: [
          {
            id: '1',
            name: 'Espresso Blend',
            price: 16.99,
            inStock: true,
          },
          {
            id: '2',
            name: 'Single Origin Ethiopia',
            price: 19.99,
            inStock: true,
          },
        ],
      });
    } catch (error) {
      console.error('Error loading business:', error);
      Alert.alert('Error', 'Could not load business data');
    } finally {
      setLoading(false);
    }
  };

  const handlePostBulletin = async () => {
    if (!bulletinText.trim()) {
      Alert.alert('Error', 'Please enter bulletin content');
      return;
    }

    setIsPosting(true);
    try {
      // TODO: API call to post bulletin
      // await fetch(`${API_URL}/api/businesses/${businessId}/bulletin`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ content: bulletinText }),
      // });

      Alert.alert('Success', 'Bulletin posted!');
      setBulletinText('');
      loadBusinessData();
    } catch (error) {
      Alert.alert('Error', 'Could not post bulletin');
    } finally {
      setIsPosting(false);
    }
  };

  const StatCard = ({ icon, label, value, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  const renderOverview = () => (
    <ScrollView style={styles.tabContent}>
      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="👁️" label="Profile Views" value={business.views} color="#667eea" />
          <StatCard icon="💬" label="Messages" value={business.messages} color="#10b981" />
          <StatCard icon="❤️" label="Favorites" value={business.favorites} color="#ef4444" />
          <StatCard icon="⭐" label="Rating" value={business.rating.toFixed(1)} color="#f59e0b" />
        </View>
      </View>

      {/* Business Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Status</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusLabel}>Currently Open</Text>
              <Text style={styles.statusSubtext}>Customers can see you're available</Text>
            </View>
            <Switch
              value={isOpen}
              onValueChange={setIsOpen}
              trackColor={{ false: '#d1d5db', true: '#667eea' }}
              thumbColor={'white'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.statusRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusLabel}>Verification Status</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified Business</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📝</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Update Bulletin</Text>
            <Text style={styles.actionSubtext}>Post weekly specials</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📦</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Products</Text>
            <Text style={styles.actionSubtext}>{business.products.length} products</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Messages</Text>
            <Text style={styles.actionSubtext}>{business.messages} unread</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>⚙️</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Business Settings</Text>
            <Text style={styles.actionSubtext}>Hours, contact info, photos</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderBulletin = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Bulletin Board</Text>
        <Text style={styles.sectionSubtext}>
          Update your bulletin once per week to share specials, events, or new products
        </Text>

        {/* Post New Bulletin */}
        <View style={styles.bulletinEditor}>
          <TextInput
            style={styles.bulletinInput}
            placeholder="What's new this week? (500 characters max)"
            value={bulletinText}
            onChangeText={setBulletinText}
            multiline
            maxLength={500}
            placeholderTextColor="#9ca3af"
          />
          <View style={styles.bulletinFooter}>
            <Text style={styles.charCount}>{bulletinText.length}/500</Text>
            <TouchableOpacity
              style={[styles.postButton, isPosting && styles.postButtonDisabled]}
              onPress={handlePostBulletin}
              disabled={isPosting}
            >
              <Text style={styles.postButtonText}>
                {isPosting ? 'Posting...' : '📢 Post Bulletin'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Bulletins */}
        <Text style={styles.subsectionTitle}>Recent Posts</Text>
        {business.bulletinPosts.map((post) => (
          <View key={post.id} style={styles.bulletinPost}>
            <Text style={styles.bulletinContent}>{post.content}</Text>
            <Text style={styles.bulletinTimestamp}>{post.timestamp}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderProducts = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Products & Services</Text>
            <Text style={styles.sectionSubtext}>{business.products.length} items</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Product</Text>
          </TouchableOpacity>
        </View>

        {business.products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
            </View>
            <View style={styles.productFooter}>
              <View style={[styles.stockBadge, !product.inStock && styles.outOfStockBadge]}>
                <Text style={[styles.stockText, !product.inStock && styles.outOfStockText]}>
                  {product.inStock ? '✓ In Stock' : 'Out of Stock'}
                </Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderAnalytics = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Analytics</Text>

        {/* Weekly Stats */}
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsTitle}>This Week</Text>
          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>Profile Views</Text>
            <Text style={styles.analyticsValue}>342 <Text style={styles.analyticsChange}>+15%</Text></Text>
          </View>
          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>New Messages</Text>
            <Text style={styles.analyticsValue}>12 <Text style={styles.analyticsChange}>+8%</Text></Text>
          </View>
          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>New Favorites</Text>
            <Text style={styles.analyticsValue}>28 <Text style={styles.analyticsChange}>+22%</Text></Text>
          </View>
          <View style={styles.analyticsRow}>
            <Text style={styles.analyticsLabel}>Review Rating</Text>
            <Text style={styles.analyticsValue}>{business.rating.toFixed(1)} ⭐ ({business.reviewCount} reviews)</Text>
          </View>
        </View>

        {/* Top Searches */}
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsTitle}>How Customers Found You</Text>
          <View style={styles.searchTagsContainer}>
            <View style={styles.searchTag}><Text>artisan coffee</Text></View>
            <View style={styles.searchTag}><Text>coffee roasters</Text></View>
            <View style={styles.searchTag}><Text>local cafe</Text></View>
            <View style={styles.searchTag}><Text>outdoor seating</Text></View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.businessName}>{business.name}</Text>
          <Text style={styles.businessCategory}>{business.category}</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNav}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bulletin' && styles.tabActive]}
          onPress={() => setActiveTab('bulletin')}
        >
          <Text style={[styles.tabText, activeTab === 'bulletin' && styles.tabTextActive]}>
            Bulletin
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
          style={[styles.tab, activeTab === 'analytics' && styles.tabActive]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.tabTextActive]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'bulletin' && renderBulletin()}
      {activeTab === 'products' && renderProducts()}
      {activeTab === 'analytics' && renderAnalytics()}
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
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  businessName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  businessCategory: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  tabNav: {
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
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#667eea',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 24,
    marginBottom: 12,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  verifiedBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  verifiedText: {
    fontSize: 14,
    color: '#065f46',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  actionButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  actionSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionArrow: {
    fontSize: 20,
    color: '#9ca3af',
  },
  bulletinEditor: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bulletinInput: {
    fontSize: 16,
    color: '#1f2937',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  bulletinFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  postButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bulletinPost: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bulletinContent: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletinTimestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  addButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  outOfStockBadge: {
    backgroundColor: '#fee2e2',
  },
  stockText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '600',
  },
  outOfStockText: {
    color: '#991b1b',
  },
  editLink: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  analyticsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  analyticsLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  analyticsChange: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: 'normal',
  },
  searchTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  searchTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
