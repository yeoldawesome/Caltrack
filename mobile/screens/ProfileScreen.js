import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../App';

// Default API base for Android emulator. Use your machine IP for a physical device.
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
    padding: 16
  },
  profileCard: {
    backgroundColor: colors.cardBg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center'
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderColor: colors.accent,
    borderWidth: 2
  },
  profilePictureText: {
    color: colors.accent,
    fontSize: 32
  },
  username: {
    color: colors.textColor,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4
  },
  email: {
    color: colors.placeholder,
    fontSize: 14,
    marginBottom: 16
  },
  changeButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6
  },
  changeButtonText: {
    color: colors.darkBg,
    fontWeight: '600'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    color: colors.textColor,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12
  },
  settingItem: {
    backgroundColor: colors.cardBg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  settingLabel: {
    color: colors.textColor,
    fontSize: 14,
    fontWeight: '600'
  },
  settingValue: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700'
  },
  input: {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: colors.textColor,
    fontSize: 16,
    marginBottom: 12
  },
  button: {
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8
  },
  buttonText: {
    color: colors.darkBg,
    fontWeight: '600',
    fontSize: 16
  },
  dangerButton: {
    backgroundColor: colors.error,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  dangerButtonText: {
    color: colors.darkBg,
    fontWeight: '600',
    fontSize: 16
  },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 20
  },
  modalTitle: {
    color: colors.textColor,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default function ProfileScreen({ route, navigation }) {
  const { user, setUser } = useContext(UserContext);
  // local copy not needed; use context for display and updates
  const [loading, setLoading] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(2000);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [modalActive, setModalActive] = useState(null); // 'password', 'username', 'pic', or null

  useEffect(() => {
    loadDailyLimit();
  }, []);

  const loadDailyLimit = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const url = `${API_BASE}/api/calorie-limit`;
      console.log('ProfileScreen: fetching daily limit', { url, token });
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDailyLimit(response.data.calorieLimit || 2000);
    } catch (err) {
      console.error('Error loading daily limit:', err);
    }
  };

  const updateUsername = async () => {
    if (!newUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.put(
        `${API_BASE}/api/profile/username`,
        { username: newUsername },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedUser = { ...user, username: newUsername };
      setUser(updatedUser);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      setModalActive(null);
      setNewUsername('');
      Alert.alert('Success', 'Username updated');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All password fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.put(
        `${API_BASE}/api/profile/password`,
        {
          currentPassword,
          newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModalActive(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password updated');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const updateProfilePicture = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true
      });

      if (!result.canceled) {
        setLoading(true);
        const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        const token = await AsyncStorage.getItem('authToken');
        const response = await axios.put(
          `${API_BASE}/api/profile/picture`,
          { profilePic: base64 },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const updatedUser = { ...user, profilePic: base64 };
        setUser(updatedUser);
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        setModalActive(null);
        Alert.alert('Success', 'Profile picture updated');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };

  const updateDailyLimit = async (newLimit) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.post(
        `${API_BASE}/api/calorie-limit`,
        { calorieLimit: newLimit },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDailyLimit(newLimit);
      Alert.alert('Success', 'Daily limit updated');
    } catch (err) {
      Alert.alert('Error', 'Failed to update daily limit');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('authToken');
            await axios.post(
              `${API_BASE}/auth/logout`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (err) {
            console.error('Logout error:', err);
          }
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('userData');
          // Update top-level user state via context so App shows Auth screen
          setUser(null);

        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profilePicture}>
          {user?.profilePic ? (
            <Image
              source={{ uri: user.profilePic }}
              style={{ width: '100%', height: '100%', borderRadius: 40 }}
            />
          ) : (
            <Text style={styles.profilePictureText}>👤</Text>
          )}
        </View>
        <Text style={styles.username}>{user?.username || user?.email || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <TouchableOpacity
          style={styles.changeButton}
          onPress={() => setModalActive('pic')}
        >
          <Text style={styles.changeButtonText}>Change Picture</Text>
        </TouchableOpacity>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Daily Calorie Limit</Text>
          <Text style={styles.settingValue}>{dailyLimit} kcal</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          {[1500, 2000, 2500, 3000].map(limit => (
            <TouchableOpacity
              key={limit}
              style={{
                flex: 1,
                backgroundColor: dailyLimit === limit ? colors.accent : colors.inputBg,
                padding: 8,
                borderRadius: 6,
                borderColor: colors.border,
                borderWidth: 1,
                alignItems: 'center'
              }}
              onPress={() => updateDailyLimit(limit)}
            >
              <Text style={{
                color: dailyLimit === limit ? colors.darkBg : colors.textColor,
                fontWeight: dailyLimit === limit ? '700' : '600'
              }}>
                {limit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => setModalActive('username')}
        >
          <Text style={styles.settingLabel}>Change Username</Text>
          <Text style={{ color: colors.accent }}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => setModalActive('password')}
        >
          <Text style={styles.settingLabel}>Change Password</Text>
          <Text style={{ color: colors.accent }}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { borderColor: colors.error }]}
          onPress={handleLogout}
        >
          <Text style={[styles.settingLabel, { color: colors.error }]}>Logout</Text>
          <Text style={{ color: colors.error }}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {modalActive === 'username' && (
        <Modal transparent visible={true} animationType="fade">
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Username</Text>
              <TextInput
                style={styles.input}
                placeholder="New username"
                placeholderTextColor={colors.placeholder}
                value={newUsername}
                onChangeText={setNewUsername}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.button}
                onPress={updateUsername}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.darkBg} />
                ) : (
                  <Text style={styles.buttonText}>Update</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.placeholder }]}
                onPress={() => {
                  setModalActive(null);
                  setNewUsername('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {modalActive === 'password' && (
        <Modal transparent visible={true} animationType="fade">
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Current password"
                placeholderTextColor={colors.placeholder}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="New password"
                placeholderTextColor={colors.placeholder}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor={colors.placeholder}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.button}
                onPress={updatePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.darkBg} />
                ) : (
                  <Text style={styles.buttonText}>Update</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.placeholder }]}
                onPress={() => {
                  setModalActive(null);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {modalActive === 'pic' && (
        <Modal transparent visible={true} animationType="fade">
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Profile Picture</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={updateProfilePicture}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.darkBg} />
                ) : (
                  <Text style={styles.buttonText}>Choose Image</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.placeholder }]}
                onPress={() => setModalActive(null)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}
