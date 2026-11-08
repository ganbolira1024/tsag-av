// Камер / цомгоос зураг авах, шахах, Supabase Storage руу хуулах
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

// source: 'camera' эсвэл 'library'. Буцаах утга: сонгосон зургийн local uri (эсвэл null)
export async function pickImage(source: 'camera' | 'library'): Promise<string | null> {
  // 1) Зөвшөөрөл асууна
  const perm =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Зөвшөөрөл хэрэгтэй', 'Тохиргооноос камер/зургийн эрхийг нээнэ үү.');
    return null;
  }

  // 2) quality: 0.5 → JPEG-ийг 50% чанартай болгож шахна (≈5-10 дахин бага хэмжээ)
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.5,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled) return null;
  return result.assets[0].uri; // урьдчилан харуулахад ашиглана
}

// Зургийг Storage-ийн 'images' bucket руу хуулж, нийтийн URL буцаана
export async function uploadImage(localUri: string, path: string): Promise<string> {
  const arrayBuffer = await fetch(localUri).then((r) => r.arrayBuffer());
  const { error } = await supabase.storage
    .from('images')
    .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('images').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`; // ?t= → кэшгүйгээр шинэ зургийг харуулна
}

// "Камер уу, цомог уу?" гэж асуух цонх
export function chooseSource(onPick: (uri: string) => void) {
  Alert.alert('Зураг сонгох', undefined, [
    { text: 'Камер', onPress: async () => { const u = await pickImage('camera'); if (u) onPick(u); } },
    { text: 'Цомог', onPress: async () => { const u = await pickImage('library'); if (u) onPick(u); } },
    { text: 'Болих', style: 'cancel' },
  ]);
}
