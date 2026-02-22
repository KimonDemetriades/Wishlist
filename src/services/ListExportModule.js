// ListExportModule.js (Expo 54+ compatible, no deprecated APIs)

import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Share, Alert, StyleSheet, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';
import pako from 'pako';

import { encode as b64encode } from 'base-64';

import { useData } from '../context/DataContext';

// ---------- Helpers: build minimal export payload ----------

const buildMinimalListExport = (list) => {
  if (!list) return null;

  return {
    name: list.name,
    createdAt: list.createdAt,
    items: list.items.map(item => ({
      title: item.title,
      description: item.description || '',
      completed: !!item.completed,
      priority: item.priority || 'medium',
      dueDate: item.dueDate || null,
    })),
  };
};

const buildFullListExport = (list) => list;

// ---------- Helpers: compression / encoding ----------

const encodeForQR = (obj) => {
  const json = JSON.stringify(obj);
  const utf8 = new TextEncoder().encode(json);
  const compressed = pako.gzip(utf8);

  // Convert Uint8Array → binary string
  let binary = '';
  for (let i = 0; i < compressed.length; i++) {
    binary += String.fromCharCode(compressed[i]);
  }

  // Convert binary string → base64
  const base64 = b64encode(binary);

  return {
    json,
    base64,
    rawLength: json.length,
    compressedLength: compressed.length,
  };
};


// ---------- Hook: useListExport ----------

export const useListExport = (listId) => {
  const { lists } = useData();

  const list = useMemo(
    () => lists.find(l => l.id === listId),
    [lists, listId]
  );

  const minimalExport = useMemo(() => buildMinimalListExport(list), [list]);
  const fullExport = useMemo(() => buildFullListExport(list), [list]);

  const getJsonString = (mode = 'minimal') => {
    const payload = mode === 'full' ? fullExport : minimalExport;
    if (!payload) return null;
    return JSON.stringify(payload, null, 2);
  };

  const getQrPayload = (mode = 'minimal') => {
    const payload = mode === 'full' ? fullExport : minimalExport;
    if (!payload) return null;
    return encodeForQR(payload);
  };

  return { list, minimalExport, fullExport, getJsonString, getQrPayload };
};

// ---------- useAllListsExport (full backup) ----------

export const useAllListsExport = () => {
  const { lists } = useData();

  const handleBackupToFile = async () => {
    try {
      const payload = JSON.stringify(
        { version: 1, exported: Date.now(), lists },
        null,
        2
      );

      const uri = FileSystem.cacheDirectory + 'backup.json';

      await FileSystem.writeAsStringAsync(uri, payload, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Not supported', 'File sharing is not available on this device.');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Backup',
        UTI: 'public.json',
      });

      await FileSystem.deleteAsync(uri, { idempotent: true });

    } catch (e) {
      Alert.alert('Backup Failed', e.message);
    }
  };

  return { handleBackupToFile };
};


// ---------- UI Component: ListExportSheet ----------

export const ListExportSheet = ({ listId, visible, onClose }) => {
  const { list, getJsonString, getQrPayload } = useListExport(listId);
  const [qrVisible, setQrVisible] = useState(false);
  const [qrData, setQrData] = useState(null);

  if (!list) return null;

  const handleCopyJson = () => {
    const json = getJsonString('minimal');
    if (!json) return;
    Clipboard.setStringAsync(json);
    Alert.alert('Copied', 'List JSON copied to clipboard.');
  };

  const handleShareJson = async () => {
    const json = getJsonString('minimal');
    if (!json) return;

    try {
      await Share.share({ message: json });
    } catch (e) {
      Alert.alert('Error', 'Unable to share JSON.');
    }
  };

  const handleShareJsonFile = async () => {
    let json = getJsonString('minimal');
    if (!json) return;

    try {
      const fileName = `list-${listId}.json`;
      const uri = FileSystem.cacheDirectory + fileName;

      await FileSystem.writeAsStringAsync(uri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Not supported', 'File sharing is not available on this device.');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/json',
        dialogTitle: 'Share List JSON',
        UTI: 'public.json',
      });

      await FileSystem.deleteAsync(uri, { idempotent: true });

    } catch (e) {
      console.error('Error sharing JSON file:', e);
      Alert.alert('Error', 'Unable to share JSON file.');
    }
  };



  const handleShowQr = () => {
    const qrPayload = getQrPayload('minimal');
    if (!qrPayload) return;

    const MAX_COMPRESSED_BYTES_FOR_QR = 1200;

    if (qrPayload.compressedLength > MAX_COMPRESSED_BYTES_FOR_QR) {
      Alert.alert(
        'Too large for QR',
        'This list is too large to export via QR. Try sharing JSON instead.'
      );
      return;
    }

    setQrData(qrPayload.base64);
    setQrVisible(true);
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.title}>Export "{list.name}"</Text>

            <ScrollView style={{ maxHeight: 260 }}>
              <Text style={styles.subtitle}>
                Choose how you’d like to export this list. JSON exports can be re‑imported later.
              </Text>

              <TouchableOpacity style={styles.button} onPress={handleCopyJson}>
                <Text style={styles.buttonText}>Copy JSON to Clipboard</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleShareJson}>
                <Text style={styles.buttonText}>Share JSON (Text)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleShareJsonFile}>
                <Text style={styles.buttonText}>Share JSON as File</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleShowQr}>
                <Text style={styles.buttonText}>Show QR (Compressed)</Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={qrVisible} transparent animationType="fade" onRequestClose={() => setQrVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.qrContainer}>
            <Text style={styles.title}>Scan to Import</Text>
            <Text style={styles.subtitle}>
              This QR contains a compressed, encoded version of your list.
            </Text>

            {qrData && (
              <View style={{ padding: 16, backgroundColor: '#fff', borderRadius: 12 }}>
                <QRCode value={qrData} size={220} />
              </View>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={() => setQrVisible(false)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ---------- Styles ----------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    width: '90%',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#111827',
  },
  qrContainer: {
    width: '90%',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#111827',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  cancelText: {
    color: '#E5E7EB',
    textAlign: 'center',
    fontSize: 14,
  },
});
