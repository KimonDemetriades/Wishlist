import React, { useState, useEffect } from 'react';
import { View, Alert, Text } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useListImport } from '../services/ImportManager';

export default function QrImportScreen({ navigation }) {
  const { importFromQr } = useListImport();
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Camera permission is required to scan QR codes.</Text>
      </View>
    );
  }

  const handleScan = ({ data }) => {
    if (hasScanned) return; // 🔥 prevents multiple triggers
    setHasScanned(true);    // 🔥 lock scanning immediately

    try {
      const newListId = importFromQr(data);
      Alert.alert('Imported', 'List imported successfully.');

      // Navigate away immediately
      navigation.replace('ListDetail', { listId: newListId });

    } catch (e) {
      Alert.alert('Import Failed', e.message);
      navigation.goBack(); // optional fallback
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleScan}
      />
    </View>
  );
}
