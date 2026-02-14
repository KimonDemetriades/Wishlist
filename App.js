import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { DataProvider } from './src/context/DataContext';
import HomeScreen from './src/screens/HomeScreen';
import ListDetailScreen from './src/screens/ListDetailScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <DataProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: '#fff' },
            headerTintColor: '#2196F3',
            headerTitleStyle: { fontWeight: 'bold' },
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
    </DataProvider>
  );
}