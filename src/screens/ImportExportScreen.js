import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAllListsExport } from '../services/ListExportModule';
import { useListImport } from '../services/ImportManager';

export default function ImportExportScreen({ navigation }) {
  const { theme } = useTheme();
  const { handleBackupToFile } = useAllListsExport();
  const { importFromJsonString, importFromFile, restoreFromBackupFile } = useListImport();

  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');

  const handleImport = () => {
    setImportError('');
    try {
      importFromJsonString(importJson);
      setImportJson('');
      setImportModalVisible(false);
      Alert.alert('Imported', 'List imported successfully.');
    } catch (e) {
      setImportError(e.message);
    }
  };

  const handleImportFromFile = async () => {
    try {
      const newListId = await importFromFile();
      if (newListId) {
        setImportModalVisible(false);
        Alert.alert('Imported', 'List imported successfully.');
        navigation.navigate('ListDetail', { listId: newListId });
      }
    } catch (e) {
      setImportError(e.message);
    }
  };

  const handleRestoreBackup = () => {
    Alert.alert(
      'Restore Backup',
      'Lists from the backup will be added to your existing lists. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            try {
              const count = await restoreFromBackupFile();
              if (count > 0) Alert.alert('Restored', `${count} list${count !== 1 ? 's' : ''} restored successfully.`);
            } catch (e) {
              Alert.alert('Restore Failed', e.message);
            }
          },
        },
      ]
    );
  };

  const ITEMS = [
    {
      icon: 'cloud-download-outline',
      label: 'Backup All Lists',
      description: 'Export all lists as a single .json file',
      onPress: handleBackupToFile,
    },
    {
      icon: 'refresh-outline',
      label: 'Restore Backup',
      description: 'Import a previously saved backup file',
      onPress: handleRestoreBackup,
    },
    {
      icon: 'document-outline',
      label: 'Import List from File',
      description: 'Open a single exported .json list file',
      onPress: async () => {
        try {
          const newListId = await importFromFile();
          if (newListId) {
            Alert.alert('Imported', 'List imported successfully.');
            navigation.navigate('ListDetail', { listId: newListId });
          }
        } catch (e) {
          Alert.alert('Import Failed', e.message);
        }
      },
    },
    {
      icon: 'clipboard-outline',
      label: 'Import List from JSON',
      description: 'Paste exported JSON text manually',
      onPress: () => { setImportError(''); setImportModalVisible(true); },
    },
    {
      icon: 'qr-code-outline',
      label: 'Import via QR',
      description: 'Scan a ListHappens QR code',
      onPress: () => navigation.navigate('QrImport'),
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Ionicons name={item.icon} size={22} color={theme.primary} style={styles.icon} />
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>{item.label}</Text>
              <Text style={[styles.rowDesc, { color: theme.textSecondary }]}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Paste JSON Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={importModalVisible}
        onRequestClose={() => setImportModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback accessible={false}>
              <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Import List</Text>

                <TouchableOpacity
                  style={[styles.modalButton, styles.fullButton, { backgroundColor: theme.primary }]}
                  onPress={handleImportFromFile}
                >
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Pick JSON File</Text>
                </TouchableOpacity>

                <Text style={[styles.hint, { color: theme.textSecondary }]}>Or paste JSON manually:</Text>

                <TextInput
                  style={[styles.textInput, {
                    color: theme.text,
                    borderColor: importError ? theme.danger : theme.border,
                    backgroundColor: theme.background,
                  }]}
                  placeholder='{ "name": "My List", "items": [...] }'
                  placeholderTextColor={theme.textSecondary}
                  value={importJson}
                  onChangeText={(t) => { setImportJson(t); setImportError(''); }}
                  multiline
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                {importError ? (
                  <Text style={[styles.errorText, { color: theme.danger }]}>{importError}</Text>
                ) : null}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: theme.border + '33', flex: 1, marginRight: 8 }]}
                    onPress={() => { setImportModalVisible(false); setImportJson(''); setImportError(''); }}
                  >
                    <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: importJson.trim() ? theme.primary : theme.border, flex: 1 }]}
                    onPress={handleImport}
                    disabled={!importJson.trim()}
                  >
                    <Text style={[styles.modalButtonText, { color: '#fff' }]}>Import</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  icon: {
    marginRight: 14,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  rowDesc: {
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 10,
    padding: 20,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  hint: {
    fontSize: 13,
    marginBottom: 8,
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  fullButton: {
    marginBottom: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});