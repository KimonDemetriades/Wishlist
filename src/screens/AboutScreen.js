import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Linking } from 'react-native';

const GUIDE_SECTIONS = [
  {
    title: '📋 Creating & Managing Lists',
    content: 'Tap the + button on the home screen to create a new list. Tap any list to open it. Long-press a list to access delete and rename options.',
  },
  {
    title: '➕ Adding Items',
    content: 'Three input modes are available from inside a list:\n\n• Single — type one item at a time\n• Bulk — paste multiple lines at once from clipboard\n• Camera — photograph a list and items are parsed automatically',
  },
  {
    title: '🧹 Bulk Add & Auto-Clean',
    content: 'Bulk mode accepts pasted text from WhatsApp, Notes, or any app. Enable Auto-Clean in Settings to automatically strip timestamps, brackets, and formatting noise from pasted content.',
  },
  {
    title: '🎯 Priorities & Due Dates',
    content: 'When adding or editing an item, set a priority (High, Medium, Low) and an optional due date. Items are colour coded so you can scan urgency at a glance.',
  },
  {
    title: '🔍 Filtering & Sorting',
    content: 'From inside a list, use the filter bar to switch between Active and Closed items. Sort by date, priority, or alphabetically using the sort controls.',
  },
  {
    title: '↕️ Reordering Items',
    content: 'Long-press any item then drag it to a new position to reorder manually.',
  },
  {
    title: '📤 Exporting a List',
    content: 'Open a list and tap the export option to share it. Five export formats are available:\n\n• Copy JSON — copies the list data to your clipboard as text\n• Share JSON (Text) — opens the share sheet with the list as plain text\n• Share JSON as File — saves a .json file named after your list (e.g. shopping_01032026.json)\n• Share as CSV — saves a .csv file you can open directly in Excel or Google Sheets\n• QR Code — generates a compressed QR code you can scan on another device\n\nNote: very large lists may not fit in a QR code. Use file sharing for those.',
  },
  {
    title: '📥 Importing a List',
    content: 'Access import options via the menu → Import & Export. Three ways to import a single list:\n\n• Import from File — opens a file picker accepting .json or .csv files\n• Import from JSON — paste exported JSON text manually\n• Import via QR — scan a ListHappens QR code with your camera\n\nImported lists are added as new lists and will not overwrite existing ones.',
  },
  {
    title: '💾 Full Backup & Restore',
    content: 'Access via the menu → Import & Export.\n\n• Backup All Lists — exports all your lists as a single backup.json file. Save to cloud storage or email to yourself.\n• Restore Backup — opens a file picker to select a previously saved backup. All lists are added alongside your existing ones.',
  },
  {
    title: '🌙 Dark Mode',
    content: 'Toggle dark mode on or off in Settings. The theme applies across the entire app.',
  },
];

// Individual collapsible guide row
function GuideSection({ title, content, theme }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.guideItem, { borderBottomColor: theme.border }]}>
      <TouchableOpacity
        style={styles.guideHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={[styles.guideTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.guideChevron, { color: theme.textSecondary }]}>
          {expanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>
      {expanded && (
        <Text style={[styles.guideContent, { color: theme.textSecondary }]}>
          {content}
        </Text>
      )}
    </View>
  );
}

export default function AboutScreen() {
  const { theme } = useTheme();
  const [guideExpanded, setGuideExpanded] = useState(false);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>

        {/* How to Use — outer collapsible wrapper */}
        <TouchableOpacity
          style={[styles.sectionToggle, { borderColor: theme.border, backgroundColor: theme.card }]}
          onPress={() => setGuideExpanded(!guideExpanded)}
          activeOpacity={0.7}
        >
          <Text style={[styles.title, { color: theme.text, marginBottom: 0 }]}>How to Use</Text>
          <Text style={[styles.guideChevron, { color: theme.textSecondary, fontSize: 13 }]}>
            {guideExpanded ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {guideExpanded && (
          <View style={[styles.guideContainer, { borderColor: theme.border }]}>
            {GUIDE_SECTIONS.map((section) => (
              <GuideSection
                key={section.title}
                title={section.title}
                content={section.content}
                theme={theme}
              />
            ))}
          </View>
        )}

        {/* About Section */}
        <Text style={[styles.title, { color: theme.text, marginTop: 30 }]}>About ListHappens</Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          Version 1.0.0
        </Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          ListHappens is a simple, powerful task management app designed to help you
          organize your life. Create lists, add items, set priorities, and track your progress.
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
          For questions or concerns about privacy please view the policy here:{'\n'}
          <Text
            style={{ color: theme.primary, textDecorationLine: 'underline' }}
            onPress={() => Linking.openURL('http://tbd.co.za/listhappens-privacy-policy')}
          >
            {'\n'}http://tbd.co.za/listhappens-privacy-policy{'\n'}
          </Text>
          {'\n'}
          You can also contact us at that site.
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
  sectionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 8,
  },
  guideContainer: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  guideItem: {
    borderBottomWidth: 1,
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  guideChevron: {
    fontSize: 11,
  },
  guideContent: {
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
});