// Firebase Web app public configuration (no Analytics). Never put admin/service-account secrets here.
window.HP_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBK8AVaClaCLGMCIKajnzAXsGbcuevHasM",
  authDomain: "meonjakgwi-ecf04.firebaseapp.com",
  projectId: "meonjakgwi-ecf04",
  storageBucket: "meonjakgwi-ecf04.firebasestorage.app",
  messagingSenderId: "226267336634",
  appId: "1:226267336634:web:0061c1996f8d6da883d783"
};
// Set true ONLY after enabling Anonymous Auth, creating Firestore, and deploying rules + functions.
// Read-only check: Auth CONFIGURATION_NOT_FOUND / Firestore SERVICE_DISABLED (2026-11-10 KST).
// false (or config=null): offline game + backup work, recovery/chat show '서버 준비 중'.
window.HP_FIREBASE_SERVER_READY = false;
