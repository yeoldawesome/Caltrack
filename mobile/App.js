import React, { useEffect, useState, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import EntriesScreen from './screens/EntriesScreen';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Keep the splash visible while loading
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

const colors = {
  darkBg: '#181c20',
  cardBg: '#23272b',
  accent: '#4fd1c5',
  textColor: '#f5f6fa',
  border: '#2d3237',
  inputBg: '#23272b',
  inputBorder: '#353b41',
  placeholder: '#7b848b'
};

export const UserContext = createContext({ user: null, setUser: () => {} });

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Not loading custom fonts to avoid missing asset errors in development
  const fontsLoaded = true;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    } finally {
      setAuthChecked(true);
      setLoading(false);
      await SplashScreen.hideAsync();
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.darkBg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // Render auth screen if not logged in, otherwise tabs
  if (!user) {
    return <AuthScreen setUser={setUser} />;
  }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>
    </UserContext.Provider>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Entries') {
            iconName = focused ? 'list' : 'list-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.placeholder,
        tabBarStyle: {
          backgroundColor: colors.cardBg,
          borderTopColor: colors.border,
          borderTopWidth: 1
        },
        headerStyle: {
          backgroundColor: colors.cardBg,
          borderBottomColor: colors.border,
          borderBottomWidth: 1
        },
        headerTintColor: colors.textColor,
        headerTitleStyle: {
          fontWeight: '600'
        }
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        initialParams={{ colors }}
        options={{ title: 'Log Calories' }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        initialParams={{ colors }}
        options={{ title: 'History' }}
      />
      <Tab.Screen 
        name="Entries" 
        component={EntriesScreen}
        options={{ title: 'Entries' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        initialParams={{ colors }}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
