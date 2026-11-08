// Supabase client: апп даяар нэг л удаа үүсгээд бүх дэлгэц энийг import хийнэ
import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Түлхүүрүүд .env файлаас ирнэ. Энд зөвхөн anon (нийтийн) түлхүүр байна,
// service_role түлхүүрийг апп-д ХЭЗЭЭ Ч хийхгүй (APK-г задлаад уншиж болно).
const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// SecureStore нэг утганд ~2KB л хадгалдаг. Supabase session үүнээс урт байж болох тул
// хэсэг хэсгээр (chunk) хувааж хадгална: key_n = хэдэн хэсэг, key_0, key_1 ...
const CHUNK_SIZE = 1800;

async function getItem(key: string): Promise<string | null> {
  const count = await SecureStore.getItemAsync(`${key}_n`);
  if (!count) return null;
  let value = '';
  for (let i = 0; i < Number(count); i++) {
    value += (await SecureStore.getItemAsync(`${key}_${i}`)) ?? '';
  }
  return value;
}

async function removeItem(key: string): Promise<void> {
  const count = await SecureStore.getItemAsync(`${key}_n`);
  if (count) {
    for (let i = 0; i < Number(count); i++) {
      await SecureStore.deleteItemAsync(`${key}_${i}`);
    }
  }
  await SecureStore.deleteItemAsync(`${key}_n`);
}

async function setItem(key: string, value: string): Promise<void> {
  await removeItem(key);
  const parts = Math.ceil(value.length / CHUNK_SIZE);
  for (let i = 0; i < parts; i++) {
    await SecureStore.setItemAsync(`${key}_${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
  }
  await SecureStore.setItemAsync(`${key}_n`, String(parts));
}

// Вэб дээр SecureStore байхгүй → браузерын localStorage ашиглана.
// Сервер талд (window байхгүй) юу ч хадгалахгүй.
const webStorage = {
  getItem: async (k: string) => (typeof window === 'undefined' ? null : window.localStorage.getItem(k)),
  setItem: async (k: string, v: string) => { if (typeof window !== 'undefined') window.localStorage.setItem(k, v); },
  removeItem: async (k: string) => { if (typeof window !== 'undefined') window.localStorage.removeItem(k); },
};

export const supabase = createClient(url, anonKey, {
  auth: {
    // Утсан дээр: SecureStore (шифрлэгдсэн). Вэб дээр: localStorage
    storage: Platform.OS === 'web' ? webStorage : { getItem, setItem, removeItem },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Апп идэвхтэй үед л token-оо автоматаар шинэчилнэ (Supabase-ийн зөвлөмж)
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
