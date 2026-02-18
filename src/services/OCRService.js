import * as ImagePicker from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';

export const OCRService = {
  // Pick image from camera
  async pickFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return null;
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    
    return result.canceled ? null : result.assets[0].uri;
  },

  // Pick image from gallery
  async pickFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return null;
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    
    return result.canceled ? null : result.assets[0].uri;
  },

  // Extract text from image using ML Kit       //console.error('OCR Error:', error);
  async extractText(imageUri) {
    try {
      const result = await TextRecognition.recognize(imageUri);
      return result.text;
    } catch (error) {
		
      return null;
    }
  },

  // Parse text into list items (same logic as bulk add)
  parseTextToItems(text) {
    return text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
  },

  // Complete flow: pick image → OCR → parse
  async processImage(source = 'gallery') {
    const imageUri = source === 'camera' 
      ? await this.pickFromCamera()
      : await this.pickFromGallery();
    
    if (!imageUri) return null;
    
    const text = await this.extractText(imageUri);
    if (!text) return null;
    
    return this.parseTextToItems(text);
  }
};