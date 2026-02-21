import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { autoClean, setAutoClean } = useSettings();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        
        {/* Appearance Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
        
        <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              Use dark theme throughout the app
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#ccc', true: theme.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Bulk Add Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Bulk Add</Text>
        
        <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Auto-Clean Items</Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              When toggled, clean function (bulk load) removes formatting like [brackets] and timestamps when pasting from WhatsApp or other apps. 
			  {"\n"}{"\n"}
			  If this is off, only the initial brackets are removed when applied.
            </Text>
          </View>
          <Switch
            value={autoClean}
            //onValueChange={setAutoClean}
			onValueChange={(value) => {
			  console.log("🔄 Clean Toggle changed:", value);
			  setAutoClean(value);
			}}
            trackColor={{ false: '#ccc', true: theme.primary }}
            thumbColor="#fff"
          />
        </View>

        {/* Info Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Information</Text>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          App Version: 1.0.0
        </Text>

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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoText: {
    fontSize: 14,
    marginTop: 8,
  },
});