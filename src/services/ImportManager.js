// ImportManager.js
// Handles JSON import, QR import, validation, and insertion into DataContext.

import { Alert } from 'react-native';
import pako from 'pako';
import { useData } from '../context/DataContext';
import { decode as b64decode } from 'base-64';


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
        item.priority || 'medium'
      );

      // If full export includes completed flag:
      if (item.completed) {
        // We can't toggle immediately because addItem generates a new ID.
        // Instead, we will toggle after all items are added.
      }
    });

    return newListId;
  };

  return {
    importFromJsonString,
    importFromQr,
  };
};
