import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../context/UserContext';
import MacrosPieChart, { MacrosPieChartWithLabels } from '../components/MacrosPieChart';
import { parseLocalDateString } from '../utils/dateUtils';
import { getLocalDateString } from '../utils/dateUtils';

// Default API base for Android emulator. Use your machine IP for a physical device.
const API_BASE = 'http://10.0.2.2:4000';

const colors = {
  darkBg: '#181c20',
  cardBg: '#23272b',
  accent: '#4fd1c5',
  textColor: '#f5f6fa',
  border: '#2d3237',
  placeholder: '#7b848b',
  error: '#ef4444'
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.darkBg, padding: 16 },
  card: {
    backgroundColor: colors.cardBg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  title: { color: colors.textColor, fontSize: 18, fontWeight: '600', marginBottom: 8 },
  value: { color: colors.accent, fontSize: 16, fontWeight: '700' },
});

export default function HistoryScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthData, setMonthData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayEntries, setDayEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [macroTotals, setMacroTotals] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [dayTotal, setDayTotal] = useState(0); // calories for selected day

  useContext(UserContext); // trigger rerender when user changes

  useEffect(() => {
    loadMonthData();
  }, [currentMonth]);

  const loadMonthData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const url = `${API_BASE}/api/entries/month/${year}/${month}`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data || [];
      const grouped = {};
      data.forEach(e => {
        if (!grouped[e.date]) grouped[e.date] = [];
        grouped[e.date].push(e);
      });
      setMonthData(grouped);
    } catch (err) {
      console.error('Month load failed', err);
      setMonthData({});
    } finally {
      setLoading(false);
    }
  };

  const loadDayEntries = async (dateStr) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await axios.get(`${API_BASE}/api/entries/${dateStr}`, { headers: { Authorization: `Bearer ${token}` } });
      const entries = res.data || [];
      setDayEntries(entries);
      setSelectedDate(dateStr);
      // compute macros and total calories
      const p = entries.reduce((s, e) => s + (e.protein || 0), 0);
      const c = entries.reduce((s, e) => s + (e.carbs || 0), 0);
      const f = entries.reduce((s, e) => s + (e.fat || 0), 0);
      const tot = entries.reduce((s, e) => s + (e.calories || 0), 0);
      setMacroTotals({ protein: p, carbs: c, fat: f });
      setDayTotal(tot);
    } catch (e) {
      console.error('day fetch failed', e);
      setDayEntries([]);
      setMacroTotals({ protein:0, carbs:0, fat:0 });
      setDayTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  if (loading) {
    return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator color={colors.accent} size="large"/></View>;
  }

  const getCalendarMatrix = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const matrix = [];
    let week = new Array(7).fill(null);
    let dayCounter = 1;
    for (let i = firstDay; i < 7; i++) {
      week[i] = dayCounter++;
    }
    matrix.push(week);
    while (dayCounter <= daysInMonth) {
      week = new Array(7).fill(null);
      for (let i = 0; i < 7 && dayCounter <= daysInMonth; i++) {
        week[i] = dayCounter++;
      }
      matrix.push(week);
    }
    return matrix;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 8 }}>
        <TouchableOpacity onPress={handlePrevMonth}><Text style={{ color: colors.accent }}>←</Text></TouchableOpacity>
        <Text style={{ color: colors.textColor, fontWeight: '600' }}>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
        <TouchableOpacity onPress={handleNextMonth}><Text style={{ color: colors.accent }}>→</Text></TouchableOpacity>
      </View>
      <View>
        <View style={{ flexDirection: 'row' }}>
          {['S','M','T','W','T','F','S'].map((d,i) => (
            <Text key={`${d}${i}`} style={{ flex:1, textAlign:'center', color: colors.placeholder, fontSize:12 }}>{d}</Text>
          ))}
        </View>
        {getCalendarMatrix().map((week,i) => (
          <View key={i} style={{ flexDirection:'row' }}>
            {week.map((day,j) => {
              const dateStr = day ? `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` : null;
              const total = dateStr && monthData[dateStr] ? monthData[dateStr].reduce((s,e)=>s+(e.calories||0),0) : 0;
              return (
                <TouchableOpacity
                  key={j}
                  style={{ flex:1, padding:6, borderWidth:1, borderColor: colors.border, height:60, justifyContent:'center', alignItems:'center', backgroundColor: dateStr && selectedDate===dateStr ? colors.cardBg : 'transparent' }}
                  onPress={() => day && loadDayEntries(dateStr)}
                >
                  <Text style={{ color: day ? colors.textColor : 'transparent' }}>{day || ''}</Text>
                  {total>0 && <View style={{ width:6,height:6, borderRadius:3, backgroundColor: colors.accent, marginTop:2 }} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {selectedDate && (
        <>
          <View style={{ alignItems:'center', marginTop:16 }}>
            <Text style={styles.title}>{selectedDate ? parseLocalDateString(selectedDate).toDateString() : ''}</Text>
            <View style={{ marginTop: 12 }}>
              <MacrosPieChartWithLabels 
                protein={macroTotals.protein} 
                carbs={macroTotals.carbs} 
                fat={macroTotals.fat} 
                totalCalories={dayTotal}
                size={140}
                strokeWidth={16}
              />
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            {dayEntries.map((e,i)=>(
              <View key={i} style={styles.card}>
                <Text style={styles.title}>{e.food || 'Entry'}</Text>
                <Text style={styles.value}>{e.calories} kcal</Text>
              </View>
            ))}
            {dayEntries.length===0 && <Text style={{color:colors.placeholder, textAlign:'center', margin:20}}>No entries for this day.</Text>}
          </View>
        </>
      )}
    </ScrollView>
  );
}
