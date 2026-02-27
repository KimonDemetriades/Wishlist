// ImportManager.js
// Handles JSON import, QR import, file import, backup restore, validation, and insertion into DataContext.

import { Alert } from 'react-native';
import pako from 'pako';
import { useData } from '../context/DataContext';
import { decode as b64decode } from 'base-64';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';


// -----------------------------
// Helpers: decode QR payload
// -----------------------------

export const decodeQrPayload = (base64String) => {
  try {
    // base64 → binary string
    const binary = b64decode(base64String);

    // binary string → Uint8Array
    const compressed = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      compressed[i] = binary.charCodeAt(i);
    }

    const decompressed = pako.ungzip(compressed);
    const json = new TextDecoder().decode(decompressed);

    return JSON.parse(json);
  } catch (e) {
    console.error('QR decode error:', e);
    throw new Error('Invalid QR code data');
  }
};

// -----------------------------
// Helpers: validate minimal schema
// -----------------------------

const isMinimalExport = (obj) => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.items)
  );
};

const isFullExport = (obj) => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.items)
  );
};

// -----------------------------
// Hook: useListImport
// -----------------------------

export const useListImport = () => {
  const { createList, addItem } = useData();

  // Import from raw JSON string
  const importFromJsonString = (jsonString) => {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error('Invalid JSON format');
    }

    return importParsedObject(parsed);
  };

  // Import from QR (base64 gzip)
  const importFromQr = (base64String) => {
    const parsed = decodeQrPayload(base64String);
    return importParsedObject(parsed);
  };

  // NEW: Import single list from a .json file via document picker
  const importFromFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) return null;

    const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
    return importFromJsonString(fileContent);
  };

  // NEW: Restore full backup from a .json file via document picker
  // Loops through each list in the backup and imports individually —
  // no DataContext changes required
  const restoreFromBackupFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) return 0;

    const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);

    let parsed;
    try {
      parsed = JSON.parse(fileContent);
    } catch (e) {
      throw new Error('Invalid backup file');
    }

    // Validate it looks like a full backup
    if (!parsed.version || !Array.isArray(parsed.lists)) {
      throw new Error('This file is not a valid ListHappens backup.\nTry "Import List" for single list files.');
    }

    let imported = 0;
    for (const list of parsed.lists) {
      try {
        importParsedObject(list);
        imported++;
      } catch (e) {
        console.warn('Skipped a list during restore:', e.message);
      }
    }

    return imported;
  };

  // Core importer
  const importParsedObject = (obj) => {
    if (!isMinimalExport(obj) && !isFullExport(obj)) {
      throw new Error('Unsupported import format');
    }

    // Create new list
    const newListId = createList(obj.name);

    // Add items
    obj.items.forEach(item => {
      addItem(
        newListId,
        item.title || '',
        item.description || '',
        item.dueDate || null,
        item.priority || 'medium',
        item.completed || false   // preserve completed state from export
      );
    });

    return newListId;
  };

  return {
    importFromJsonString,
    importFromQr,
    importFromFile,
    restoreFromBackupFile,
  };
};