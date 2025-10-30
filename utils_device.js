// utils/device.js
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const DEVICE_KEY = 'toto_device_id';

export async function getDeviceId() {
  try {
    let id = await SecureStore.getItemAsync(DEVICE_KEY);
    if (id) return id;
    id = uuidv4();
    await SecureStore.setItemAsync(DEVICE_KEY, id);
    return id;
  } catch (err) {
    console.warn('SecureStore/getDeviceId error', err);
    // fallback to in-memory uid (not persistent) — but prefer SecureStore
    const fallback = uuidv4();
    return fallback;
  }
}