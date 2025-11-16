/**
 * Push Notification Service for Localist Frontend
 *
 * Handles Expo push notifications, permissions, and registration
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { NotificationsAPI } from './api';

// Configure notification handler (how notifications appear when app is in foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and get Expo push token
 *
 * @returns {Promise<string|null>} Expo push token or null if failed
 */
export async function registerForPushNotificationsAsync() {
  let token = null;

  // Only works on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Ask for permission if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permissions');
    return null;
  }

  // Get Expo push token
  try {
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('✅ Got Expo push token:', token);

    // Register token with backend
    try {
      await NotificationsAPI.registerPushToken(token);
      console.log('✅ Registered push token with backend');
    } catch (error) {
      console.error('Failed to register push token with backend:', error);
    }

    // Android notification channel setup
    if (Platform.OS === 'android') {
      await setupAndroidNotificationChannels();
    }

    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Set up Android notification channels
 * Required for Android 8.0+ to show notifications
 */
async function setupAndroidNotificationChannels() {
  // Messages channel (high priority)
  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#667eea',
    sound: 'default',
    description: 'New messages from businesses and customers',
  });

  // Bulletins channel (default priority)
  await Notifications.setNotificationChannelAsync('bulletins', {
    name: 'Bulletin Posts',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: '#667eea',
    sound: 'default',
    description: 'New bulletin posts from businesses you follow',
  });

  // Recommendations channel (low priority)
  await Notifications.setNotificationChannelAsync('recommendations', {
    name: 'Recommendations',
    importance: Notifications.AndroidImportance.LOW,
    vibrationPattern: [0, 250],
    lightColor: '#667eea',
    sound: null, // Silent
    description: 'Personalized business recommendations',
  });

  // Reviews channel (default priority)
  await Notifications.setNotificationChannelAsync('reviews', {
    name: 'Reviews',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: '#667eea',
    sound: 'default',
    description: 'Responses to your reviews',
  });

  console.log('✅ Android notification channels configured');
}

/**
 * Handle notification tap (when user taps notification)
 *
 * @param {Object} notification - Notification object
 * @param {Object} navigation - React Navigation object
 */
export function handleNotificationTap(notification, navigation) {
  const data = notification.request.content.data;

  if (!data || !data.type) {
    return;
  }

  switch (data.type) {
    case 'new_message':
      // Navigate to messages screen with conversation
      if (data.conversation_id) {
        navigation.navigate('Messages', {
          conversationId: data.conversation_id,
          senderName: data.sender_name,
        });
      }
      break;

    case 'new_bulletin':
      // Navigate to business detail
      if (data.business_id) {
        navigation.navigate('BusinessDetail', {
          businessId: data.business_id,
        });
      }
      break;

    case 'recommendation':
      // Navigate to business detail
      if (data.business_id) {
        navigation.navigate('BusinessDetail', {
          businessId: data.business_id,
        });
      }
      break;

    case 'review_response':
      // Navigate to review
      if (data.review_id) {
        navigation.navigate('ReviewDetail', {
          reviewId: data.review_id,
        });
      }
      break;

    default:
      console.log('Unknown notification type:', data.type);
  }
}

/**
 * Set up notification listeners
 *
 * @param {Object} navigation - React Navigation object
 * @returns {Function} Cleanup function to remove listeners
 */
export function setupNotificationListeners(navigation) {
  // Listen for notifications received while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('📬 Notification received (foreground):', notification);
    // Notification will be shown automatically based on setNotificationHandler config
  });

  // Listen for notification taps
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('👆 Notification tapped:', response);
    handleNotificationTap(response.notification, navigation);
  });

  // Return cleanup function
  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Update notification badge count
 *
 * @param {number} count - Badge number (0 to clear)
 */
export async function setBadgeCount(count) {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
  await setBadgeCount(0);
}

/**
 * Send a local notification (for testing)
 *
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Custom data payload
 */
export async function sendLocalNotification(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null, // Show immediately
  });
}

/**
 * Check if notifications are enabled
 *
 * @returns {Promise<boolean>} True if enabled, false otherwise
 */
export async function areNotificationsEnabled() {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Unregister from push notifications
 */
export async function unregisterFromPushNotifications() {
  try {
    await NotificationsAPI.unregisterPushToken();
    console.log('✅ Unregistered push token from backend');
  } catch (error) {
    console.error('Failed to unregister push token:', error);
  }
}

export default {
  register: registerForPushNotificationsAsync,
  setupListeners: setupNotificationListeners,
  handleTap: handleNotificationTap,
  setBadgeCount,
  clearAllNotifications,
  sendLocalNotification,
  areNotificationsEnabled,
  unregister: unregisterFromPushNotifications,
};
