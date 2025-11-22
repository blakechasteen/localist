/**
 * Patron Messages Screen
 *
 * Customer chat interface with businesses
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';

const API_URL = 'http://localhost:8000';

export default function PatronMessagesScreen({ route, navigation }) {
  const { business } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);

  // Mock conversation data
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    // Mock messages (replace with API call)
    const mockMessages = [
      {
        id: '1',
        text: 'Hi! Do you have any dairy-free milk options?',
        timestamp: '10:30 AM',
        isMine: true,
      },
      {
        id: '2',
        text: 'Yes! We have oat milk, almond milk, and coconut milk. All organic! 🌱',
        timestamp: '10:32 AM',
        isMine: false,
        senderName: business?.name || 'Business',
      },
      {
        id: '3',
        text: 'Perfect! I\'ll stop by this afternoon.',
        timestamp: '10:33 AM',
        isMine: true,
      },
      {
        id: '4',
        text: 'Great! We\'re here until 6pm. Looking forward to seeing you! ☕',
        timestamp: '10:34 AM',
        isMine: false,
        senderName: business?.name || 'Business',
      },
    ];

    setMessages(mockMessages);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputText,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
      isMine: true,
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Mock response from business (simulate typing)
    setIsTyping(true);
    setTimeout(() => {
      const responses = [
        'Thanks for reaching out!',
        'Sure, I can help with that.',
        'Let me check on that for you.',
        'Absolutely! We\'d be happy to help.',
      ];

      const response = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        isMine: false,
        senderName: business?.name || 'Business',
      };

      setMessages((prev) => [...prev, response]);
      setIsTyping(false);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 2000);
  };

  const renderMessage = ({ item }) => {
    if (item.isMine) {
      return (
        <View style={styles.myMessageContainer}>
          <View style={styles.myMessageBubble}>
            <Text style={styles.myMessageText}>{item.text}</Text>
          </View>
          <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.theirMessageContainer}>
          <View style={styles.theirMessageBubble}>
            <Text style={styles.theirMessageText}>{item.text}</Text>
          </View>
          <Text style={styles.messageTimestamp}>{item.timestamp}</Text>
        </View>
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{business?.name || 'Messages'}</Text>
          <Text style={styles.headerSubtitle}>Usually replies within an hour</Text>
        </View>
        <TouchableOpacity style={styles.infoButton}>
          <Text style={styles.infoButtonText}>ℹ️</Text>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <View style={styles.typingIndicator}>
          <View style={styles.typingDot} />
          <View style={[styles.typingDot, styles.typingDot2]} />
          <View style={[styles.typingDot, styles.typingDot3]} />
          <Text style={styles.typingText}>{business?.name || 'Business'} is typing...</Text>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={styles.sendButtonText}>➤</Text>
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
  headerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  infoButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: {
    fontSize: 20,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  myMessageBubble: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    maxWidth: '75%',
  },
  myMessageText: {
    color: 'white',
    fontSize: 15,
    lineHeight: 20,
  },
  theirMessageContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  theirMessageBubble: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  theirMessageText: {
    color: '#1f2937',
    fontSize: 15,
    lineHeight: 20,
  },
  messageTimestamp: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
    marginHorizontal: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9ca3af',
    marginRight: 4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 0.4,
  },
  typingText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 8,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f2937',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
