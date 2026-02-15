import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { DataProvider } from './src/context/DataContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

import HomeScreen from './src/screens/HomeScreen';
import ListDetailScreen from './src/screens/ListDetailScreen';

const Stack = createStackNavigator();

// 🔥 Inner app so we can access theme inside NavigationContainer
function AppInner() {
  const { theme, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <NavigationContainer
        theme={{
          ...(isDark ? DarkTheme : DefaultTheme),
          colors: {
            ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
            background: theme.background,
            card: theme.card,
            text: theme.text,
            border: theme.border,
            primary: theme.primary,
            notification: theme.primary,
          },
        }}
      >
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: theme.card },
            headerTintColor: theme.text,
            headerTitleStyle: { color: theme.text, fontWeight: 'bold' },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'My Lists' }}
          />
          <Stack.Screen
            name="ListDetail"
            component={ListDetailScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <AppInner />
      </DataProvider>
    </ThemeProvider>
  );
}
