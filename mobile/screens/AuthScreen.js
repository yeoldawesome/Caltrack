import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Default API base: use Android emulator host mapping. Change to your machine IP when testing on a device.
const API_BASE = 'http://10.0.2.2:4000';

const colors = {
  darkBg: '#181c20',
  cardBg: '#23272b',
  accent: '#4fd1c5',
  textColor: '#f5f6fa',
  border: '#2d3237',
  inputBg: '#23272b',
  inputBorder: '#353b41',
  placeholder: '#7b848b',
  error: '#ef4444'
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
    paddingHorizontal: 20,
  },
  innerContainer: {
    flexGrow: 1,
    justifyContent: 'center'
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textColor,
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: colors.placeholder,
    marginBottom: 30,
    textAlign: 'center'
  },
  input: {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: colors.textColor,
    fontSize: 16
  },
  button: {
    backgroundColor: colors.accent,
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center'
  },
  buttonText: {
    color: colors.darkBg,
    fontWeight: '600',
    fontSize: 16
  },
  toggleButton: {
    backgroundColor: 'transparent',
    padding: 14,
    borderRadius: 8,
    borderColor: colors.accent,
    borderWidth: 1,
    alignItems: 'center'
  },
  toggleButtonText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 16
  },
  errorText: {
    color: colors.error,
    marginBottom: 12,
    textAlign: 'center'
  }
});

export default function AuthScreen({ setUser }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuthSubmit = async () => {
    setError('');

    if (!email && !username) {
      setError('Email or username required');
      return;
    }
    if (!password) {
      setError('Password required');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const url = mode === 'login' 
        ? `${API_BASE}/auth/login`
        : `${API_BASE}/auth/signup`;

      const response = await axios.post(url, {
        email: email || undefined,
        username: username || undefined,
        password
      }, {
        withCredentials: true
      });

      console.log('AuthScreen response', response.data);

      if (response.data && response.data.user) {
        // Save token and user info
        await AsyncStorage.setItem('authToken', response.data.token || 'authenticated');
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        setUser(response.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { minHeight: '100%' }]}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Caltrack</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.placeholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={!loading}
          />

          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Username (optional)"
              placeholderTextColor={colors.placeholder}
              value={username}
              onChangeText={setUsername}
              editable={!loading}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={colors.placeholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!loading}
            />
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={handleAuthSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.darkBg} />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'login' ? 'Sign In' : 'Sign Up'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
            }}
            disabled={loading}
          >
            <Text style={styles.toggleButtonText}>
              {mode === 'login' 
                ? "Don't have an account? Sign Up" 
                : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
