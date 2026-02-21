import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function AboutScreen() {
  const { theme } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        
        {/* About Section */}
        <Text style={[styles.title, { color: theme.text }]}>About ListHappens</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          Version 1.0.0
        </Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          ListHappens is a simple, powerful task management app designed to help you 
          organize your life. Create lists, add items, set priorities, and track your progress.
        </Text>

        {/* Features */}
        <Text style={[styles.subtitle, { color: theme.text }]}>Features</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          • Create unlimited lists{'\n'}
          • Add tasks with descriptions and due dates{'\n'}
          • Set priority levels (High, Medium, Low){'\n'}
          • Bulk add items from clipboard including text cleaning functionality{'\n'}
          • Drag and drop to reorder tasks{'\n'}
          • Dark mode support{'\n'}
          • Filter and sort tasks{'\n'}
		  • Parse lists from images{'\n'}
		  {'\n'}
		  From the list page, key functionality includes ability to filter active or closed items; filter/sort alphabetically or on date and priority. The three key modes of input include single upload; bulk upload and camera/visual input.
        </Text>

        {/* Privacy Policy */}
        <Text style={[styles.title, { color: theme.text, marginTop: 30 }]}>Privacy Policy</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          Last updated: 18 February 2026
        </Text>

        <Text style={[styles.subtitle, { color: theme.text }]}>Data Storage</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          All your data is stored locally on your device. We do not collect, transmit, 
          or store any of your personal information on external servers.
        </Text>

        <Text style={[styles.subtitle, { color: theme.text }]}>Permissions</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          • Storage: Required to save your lists and tasks locally{'\n'}
          • Camera (optional): Only used if you choose to scan images for text
        </Text>

        <Text style={[styles.subtitle, { color: theme.text }]}>Third-Party Services</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          This app does not use any third-party analytics, advertising, or tracking services.
        </Text>

        <Text style={[styles.subtitle, { color: theme.text }]}>Contact</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          For questions or concerns about privacy please view policy here: http://tbd.co.za/listhappens-privacy-policy{'\n'}
		  You can also  contact us at that site.
        </Text>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
});