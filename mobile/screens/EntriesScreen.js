import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import MacrosPieChart, { MacrosPieChartWithLabels } from '../components/MacrosPieChart';
import { getLocalDateString, parseLocalDateString } from '../utils/dateUtils';

const API_BASE = 'http://10.0.2.2:4000';

const colors = {
  darkBg: '#181c20',
  cardBg: '#23272b',
  accent: '#4fd1c5',
  textColor: '#f5f6fa',
  border: '#2d3237',
  placeholder: '#7b848b',
  error: '#ef4444',
  inputBg: '#23272b',
  inputBorder: '#353b41'
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.darkBg, padding: 16 },
  title: { color: colors.textColor, fontSize: 20, fontWeight: '600' },
  card: {
    backgroundColor: colors.cardBg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  favButton: { padding: 6 }
});

export default function EntriesScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editCalories, setEditCalories] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [macroTotals, setMacroTotals] = useState({ protein: 0, carbs: 0, fat: 0 });

  useEffect(() => {
    loadForDate(selectedDate);
  }, [selectedDate]);

  const loadForDate = async (date) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const dstr = getLocalDateString(date);
      const res = await axios.get(`${API_BASE}/api/entries/${dstr}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data || [];
      setEntries(data);
      const p = data.reduce((s, e) => s + (e.protein || 0), 0);
      const c = data.reduce((s, e) => s + (e.carbs || 0), 0);
      const f = data.reduce((s, e) => s + (e.fat || 0), 0);
      setMacroTotals({ protein: p, carbs: c, fat: f });
    } catch (err) {
      console.error('loadForDate error', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.delete(`${API_BASE}/api/entry/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      loadForDate(selectedDate);
    } catch (err) {
      Alert.alert('Error deleting');
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.put(`${API_BASE}/api/entry/${editing._id}`, { calories: Number(editCalories) }, { headers: { Authorization: `Bearer ${token}` } });
      setEditing(null);
      loadForDate(selectedDate);
    } catch (err) {
      Alert.alert('Error saving');
    }
  };

  const favoriteEntry = async (entry) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await axios.post(`${API_BASE}/api/favorites`, { food: entry.food || 'Entry', details: entry }, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert('Favorited');
    } catch (err) {
      Alert.alert('Error favoriting');
    }
  };

  const renderEntryList = (list) => {
    if (list.length === 0) {
      return <Text style={{ color: colors.placeholder, marginTop: 20, textAlign: 'center', fontSize: 14 }}>No entries for this date</Text>;
    }
    return list.map(e => (
      <View key={e._id} style={styles.card}>
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.textColor, fontSize: 18, fontWeight: '600', marginBottom: 4 }}>
            {e.food || 'Entry'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Text style={{ color: colors.accent, fontSize: 24, fontWeight: '700' }}>
              {e.calories}
            </Text>
            <Text style={{ color: colors.placeholder, fontSize: 14, marginTop: 6 }}>kcal</Text>
          </View>
          {(e.protein || e.carbs || e.fat) && (
            <Text style={{ color: colors.placeholder, fontSize: 12, marginTop: 8 }}>
              P:{e.protein}g | C:{e.carbs}g | F:{e.fat}g
            </Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
          <TouchableOpacity 
            onPress={() => favoriteEntry(e)} 
            style={{ alignItems: 'center', padding: 10, flex: 1 }}
          >
            <Ionicons name="heart-outline" size={24} color={colors.accent} />
            <Text style={{ color: colors.placeholder, fontSize: 11, marginTop: 4 }}>Favorite</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => { setEditing(e); setEditCalories(String(e.calories)); }} 
            style={{ alignItems: 'center', padding: 10, flex: 1 }}
          >
            <Ionicons name="pencil" size={24} color={colors.textColor} />
            <Text style={{ color: colors.placeholder, fontSize: 11, marginTop: 4 }}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => {
              Alert.alert('Delete Entry?', 'This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(e._id) }
              ]);
            }} 
            style={{ alignItems: 'center', padding: 10, flex: 1 }}
          >
            <Ionicons name="trash" size={24} color={colors.error} />
            <Text style={{ color: colors.placeholder, fontSize: 11, marginTop: 4 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    ));
  };

  if (loading) {
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator color={colors.accent} size="large"/></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={styles.title}>{selectedDate.toDateString()}</Text>
        <TouchableOpacity onPress={() => setShowPicker(true)}>
          <Ionicons name="calendar" size={28} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <MacrosPieChartWithLabels
          protein={macroTotals.protein}
          carbs={macroTotals.carbs}
          fat={macroTotals.fat}
          size={140}
          strokeWidth={16}
        />
      </View>

      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textColor, marginBottom: 12, marginTop: 12 }}>
        Entries
      </Text>

      {renderEntryList(entries)}

      {showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowPicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}

      <Modal visible={!!editing} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 20 }}>
          <View style={{ backgroundColor: colors.cardBg, padding: 20, borderRadius: 12, borderColor: colors.border, borderWidth: 1 }}>
            <Text style={{ color: colors.textColor, fontSize: 18, fontWeight: '600', marginBottom: 16 }}>Edit Calorie Entry</Text>
            <TextInput
              style={{ backgroundColor: colors.inputBg, color: colors.textColor, padding: 12, borderRadius: 8, marginBottom: 16, borderColor: colors.inputBorder, borderWidth: 1, fontSize: 16 }}
              keyboardType="number-pad"
              placeholder="Calories"
              placeholderTextColor={colors.placeholder}
              value={editCalories}
              onChangeText={setEditCalories}
            />
            <TouchableOpacity style={{ backgroundColor: colors.accent, padding: 12, borderRadius: 8, marginBottom: 10, alignItems: 'center' }} onPress={saveEdit}>
              <Text style={{ color: colors.darkBg, fontWeight: '600', fontSize: 16 }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: colors.border, padding: 12, borderRadius: 8, alignItems: 'center' }} onPress={() => setEditing(null)}>
              <Text style={{ color: colors.textColor, fontWeight: '600', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
