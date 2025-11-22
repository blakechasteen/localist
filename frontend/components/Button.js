/**
 * Shared Button Component
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';

export default function Button({ title, onPress, variant = 'primary', disabled = false, style, ...props }) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'outline' && styles.buttonOutline,
        disabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      <Text style={[
        styles.buttonText,
        variant === 'primary' && styles.buttonTextPrimary,
        variant === 'secondary' && styles.buttonTextSecondary,
        variant === 'outline' && styles.buttonTextOutline,
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#667eea',
  },
  buttonSecondary: {
    backgroundColor: '#f3f4f6',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: 'white',
  },
  buttonTextSecondary: {
    color: '#4b5563',
  },
  buttonTextOutline: {
    color: '#667eea',
  },
});
