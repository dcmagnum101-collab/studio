import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5FqRWAIcfB_xhvgqvAmslu2qX6xbqMFE",
  authDomain: "studio-7266015203-e5837.firebaseapp.com",
  databaseURL: "https://studio-7266015203-e5837-default-rtdb.firebaseio.com",
  projectId: "studio-7266015203-e5837",
  storageBucket: "studio-7266015203-e5837.firebasestorage.app",
  messagingSenderId: "844077687890",
  appId: "1:844077687890:web:0a86215d544557bab86b8b"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);
export default app;
