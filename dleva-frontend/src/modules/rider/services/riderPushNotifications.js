import { API_ENDPOINTS } from '../../../constants/apiConfig';
import { createPushNotificationsService } from '../../../services/pushNotifications';

const riderPushNotifications = createPushNotificationsService({
  storageKey: 'rider_fcm_token',
  endpoint: API_ENDPOINTS.REALTIME.REGISTER_FCM_TOKEN,
  firebaseConfig: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  },
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
});

export default riderPushNotifications;
