import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext } from 'react';
import { UserContext } from '../App';
import MacrosPieChart from '../components/MacrosPieChart';
import { getLocalDateString, parseLocalDateString } from '../utils/dateUtils';

// Default API base: Android emulator host mapping. Use your machine IP for physical device testing.
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
  section: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.placeholder,
    marginBottom: 8
  },
  input: {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: colors.textColor,
    fontSize: 16,
    marginBottom: 8
  },
  row: {
    flexDirection: 'row',
    gap: 8
  },
  flex1: {
    flex: 1
  },
  card: {
    backgroundColor: colors.cardBg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  cardTitle: {
    color: colors.textColor,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8
  },
  cardValue: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: '700'
  },
  button: {
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonSecondary: {
    backgroundColor: colors.cardBg,
    borderColor: colors.accent,
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: colors.darkBg,
    fontWeight: '600',
    fontSize: 16
  },
  buttonTextSecondary: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 16
  },
  dateContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20
  },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBg
  },
  dateButtonSelected: {
    backgroundColor: colors.cardBg,
    borderColor: colors.accent,
    borderWidth: 2
  },
  dateButtonText: {
    color: colors.placeholder,
    fontSize: 12,
    fontWeight: '500'
  },
  dateButtonTextSelected: {
    color: colors.accent,
    fontWeight: '600'
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000'
  },
  cameraCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 6
  }
});

export default function HomeScreen({ route }) {
  const { user } = useContext(UserContext);
  const { colors: passedColors } = route.params || {};
  const [calories, setCalories] = useState('');
  const [food, setFood] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [dailyLimit, setDailyLimit] = useState(2000);
  const [todayCalories, setTodayCalories] = useState(0);
  const [macroTotals, setMacroTotals] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [favorites, setFavorites] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [showFavorites, setShowFavorites] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [nutritionLoading, setNutritionLoading] = useState(false);

  useEffect(() => {
    loadTodayData();
    loadFavorites();
    loadRecent();
  }, [selectedDate]);

  const loadTodayData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const dateStr = getLocalDateString(selectedDate);
      const url = `${API_BASE}/api/entries/${dateStr}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const entries = response.data || [];
      const total = entries.reduce((sum, e) => sum + (e.calories || 0), 0);
      setTodayCalories(total);
      // compute macros totals
      const p = entries.reduce((s, e) => s + (e.protein || 0), 0);
      const c = entries.reduce((s, e) => s + (e.carbs || 0), 0);
      const f = entries.reduce((s, e) => s + (e.fat || 0), 0);
      setMacroTotals({ protein: p, carbs: c, fat: f });
    } catch (err) {
      console.error('Error loading entries:', err);
    }
  };

  const loadFavorites = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await axios.get(`${API_BASE}/api/favorites`, { headers: { Authorization: `Bearer ${token}` } });
      setFavorites(res.data || []);
    } catch (e) {
      console.error('Fav fetch error', e);
    }
  };

  const loadRecent = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await axios.get(`${API_BASE}/api/recent?limit=10`, { headers: { Authorization: `Bearer ${token}` } });
      setRecentItems(res.data || []);
    } catch (e) {
      console.error('Recent fetch error', e);
    }
  };

  const handleLogEntry = async () => {
    // after logging we want to refresh favorites/recent too
    if (!calories || isNaN(calories)) {
      Alert.alert('Error', 'Please enter a calorie amount');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const dateStr = getLocalDateString(selectedDate);
      await axios.post(
        `${API_BASE}/api/entries`,
        {
          date: dateStr,
          calories: parseInt(calories),
          food: food || 'Food entry',
          protein: protein ? parseInt(protein) : 0,
          carbs: carbs ? parseInt(carbs) : 0,
          fat: fat ? parseInt(fat) : 0
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      // refresh quick lists
      loadFavorites();
      loadRecent();

      // Reset form
      setCalories('');
      setFood('');
      setProtein('');
      setCarbs('');
      setFat('');

      // Reload today's data
      await loadTodayData();
      Alert.alert('Success', 'Entry logged successfully');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to log entry');
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeDetected = (barcodeData) => {
    // In a real app, you'd look up the barcode in a database
    setFood(barcodeData);
    setCameraOpen(false);
    Alert.alert('Barcode Scanned', `Barcode: ${barcodeData}`);
  };

  const handleCameraPermission = async () => {
    const { status } = await requestPermission();
    if (status === 'granted') {
      setCameraOpen(true);
    } else {
      Alert.alert('Permission Required', 'Camera access is required to scan barcodes');
    }
  };

  const handleNutritionLabelUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets[0]) {
        setNutritionLoading(true);
        const imageBase64 = result.assets[0].base64;

        // Use ocr.space free API
        const formData = new FormData();
        formData.append('base64Image', `data:image/jpeg;base64,${imageBase64}`);
        formData.append('apikey', 'K87899142372222'); // free tier key
        formData.append('language', 'eng');

        const ocrResponse = await axios.post('https://api.ocr.space/parse', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const ocrText = ocrResponse.data?.ParsedText || '';
        const extracted = extractNutritionInfo(ocrText);

        if (extracted.calories > 0) {
          setCalories(String(extracted.calories));
          if (extracted.protein > 0) setProtein(String(extracted.protein));
          if (extracted.carbs > 0) setCarbs(String(extracted.carbs));
          if (extracted.fat > 0) setFat(String(extracted.fat));
          Alert.alert('Success', `Extracted: ${extracted.calories}cal, P:${extracted.protein}g, C:${extracted.carbs}g, F:${extracted.fat}g`);
        } else {
          Alert.alert('Info', 'Could not extract nutrition info. Please try a clearer image or enter manually.');
        }
      }
    } catch (err) {
      console.error('Nutrition label error:', err);
      Alert.alert('Error', 'Failed to process nutrition label. Please try again.');
    } finally {
      setNutritionLoading(false);
    }
  };

  const extractNutritionInfo = (text) => {
    const result = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    // Calories
    const caloriesMatch = text.match(/(?:calories?|cal|kcal)\D*(\d+(?:\.\d+)?)/i);
    if (caloriesMatch) result.calories = Math.round(parseFloat(caloriesMatch[1]));
    
    // Protein
    const proteinMatch = text.match(/(?:protein)\D*(\d+(?:\.\d+)?)/i);
    if (proteinMatch) result.protein = Math.round(parseFloat(proteinMatch[1]));
    
    // Carbs
    const carbsMatch = text.match(/(?:carbs?|carbohydrates?)\D*(\d+(?:\.\d+)?)/i);
    if (carbsMatch) result.carbs = Math.round(parseFloat(carbsMatch[1]));
    
    // Fat
    const fatMatch = text.match(/(?:fat|total fat)\D*(\d+(?:\.\d+)?)/i);
    if (fatMatch) result.fat = Math.round(parseFloat(fatMatch[1]));
    
    return result;
  };

  // Get remaining calories
  const getRemainingCalories = () => {
    return Math.max(0, dailyLimit - todayCalories);
  };

  const getProgressPercentage = () => {
    return Math.min(100, (todayCalories / dailyLimit) * 100);
  };

  if (cameraOpen && permission?.granted) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.cameraContainer}
          onBarcodeScanned={(scanningResult) => {
            if (scanningResult.data) {
              handleBarcodeDetected(scanningResult.data);
            }
          }}
        />
        <TouchableOpacity
          style={styles.cameraCloseButton}
          onPress={() => setCameraOpen(false)}
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>×</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Date Picker Button */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textColor }}>
          {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </Text>
        <TouchableOpacity
          style={[styles.buttonSecondary, { paddingHorizontal: 12, paddingVertical: 8 }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.buttonTextSecondary}>Change Date</Text>
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}

      {/* Favorites and Recent Toggle Buttons */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <TouchableOpacity
          style={[styles.buttonSecondary, { flex: 1 }]}
          onPress={() => setShowFavorites(!showFavorites)}
        >
          <Text style={styles.buttonTextSecondary}>
            {showFavorites ? '▼ Favorites' : '▶ Favorites'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonSecondary, { flex: 1 }]}
          onPress={() => setShowRecent(!showRecent)}
        >
          <Text style={styles.buttonTextSecondary}>
            {showRecent ? '▼ Recent' : '▶ Recent'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Favorites Expanded */}
      {showFavorites && favorites.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {favorites.map(f => (
              <TouchableOpacity
                key={f._id}
                style={[styles.card, { width: '48%', marginRight: 0 }]}
                onPress={() => {
                  setCalories(String(f.details?.calories || ''));
                  setFood(f.food || '');
                  setProtein(String(f.details?.protein || ''));
                  setCarbs(String(f.details?.carbs || ''));
                  setFat(String(f.details?.fat || ''));
                }}
              >
                <Text style={{ color: colors.textColor, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>{f.food}</Text>
                <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '700' }}>{f.details?.calories || 0}</Text>
                <Text style={{ color: colors.placeholder, fontSize: 10 }}>kcal</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Recent Expanded */}
      {showRecent && recentItems.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {recentItems.map(r => (
              <TouchableOpacity
                key={r._id}
                style={[styles.card, { width: '48%', marginRight: 0 }]}
                onPress={() => {
                  setCalories(String(r.calories || ''));
                  setFood(r.food || '');
                  setProtein(String(r.protein || ''));
                  setCarbs(String(r.carbs || ''));
                  setFat(String(r.fat || ''));
                }}
              >
                <Text style={{ color: colors.textColor, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>{r.food || 'Entry'}</Text>
                <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '700' }}>{r.calories}</Text>
                <Text style={{ color: colors.placeholder, fontSize: 10 }}>kcal</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Daily Progress Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Intake</Text>
        <Text style={styles.cardValue}>{todayCalories}</Text>
        <Text style={styles.label}>/{dailyLimit} kcal</Text>
        <View style={{ marginTop: 12, backgroundColor: colors.darkBg, borderRadius: 4, height: 8, overflow: 'hidden' }}>
          <View
            style={{
              height: '100%',
              backgroundColor: getProgressPercentage() > 100 ? '#ef4444' : colors.accent,
              width: `${getProgressPercentage()}%`
            }}
          />
        </View>
        <Text style={[styles.label, { marginTop: 12, color: getRemainingCalories() > 0 ? colors.accent : colors.error }]}>
          {getRemainingCalories()} kcal remaining
        </Text>
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <MacrosPieChart
            protein={macroTotals.protein}
            carbs={macroTotals.carbs}
            fat={macroTotals.fat}
            size={100}
            strokeWidth={12}
          />
        </View>
      </View>

      {/* Log Entry Form */}
      <View style={styles.section}>
        <Text style={[styles.label, { marginBottom: 12 }]}>Log New Entry</Text>

        <TextInput
          style={styles.input}
          placeholder="Calories"
          placeholderTextColor={colors.placeholder}
          value={calories}
          onChangeText={setCalories}
          keyboardType="number-pad"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Food name (optional)"
          placeholderTextColor={colors.placeholder}
          value={food}
          onChangeText={setFood}
          editable={!loading}
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.flex1]}
            placeholder="Protein (g)"
            placeholderTextColor={colors.placeholder}
            value={protein}
            onChangeText={setProtein}
            keyboardType="number-pad"
            editable={!loading}
          />
          <TextInput
            style={[styles.input, styles.flex1]}
            placeholder="Carbs (g)"
            placeholderTextColor={colors.placeholder}
            value={carbs}
            onChangeText={setCarbs}
            keyboardType="number-pad"
            editable={!loading}
          />
          <TextInput
            style={[styles.input, styles.flex1]}
            placeholder="Fat (g)"
            placeholderTextColor={colors.placeholder}
            value={fat}
            onChangeText={setFat}
            keyboardType="number-pad"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { marginBottom: 8, opacity: loading ? 0.6 : 1 }]}
          onPress={handleLogEntry}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.darkBg} />
          ) : (
            <Text style={styles.buttonText}>Log Entry</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={handleCameraPermission}
          disabled={loading}
        >
          <Text style={styles.buttonTextSecondary}>Scan Barcode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonSecondary, { opacity: nutritionLoading ? 0.6 : 1 }]}
          onPress={handleNutritionLabelUpload}
          disabled={nutritionLoading}
        >
          {nutritionLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={styles.buttonTextSecondary}>Add from Nutrition Label</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
