// Firebase Web app public configuration (no Analytics). Never put admin/service-account secrets here.
window.HP_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBK8AVaClaCLGMCIKajnzAXsGbcuevHasM",
  authDomain: "meonjakgwi-ecf04.firebaseapp.com",
  projectId: "meonjakgwi-ecf04",
  storageBucket: "meonjakgwi-ecf04.firebasestorage.app",
  messagingSenderId: "226267336634",
  appId: "1:226267336634:web:0061c1996f8d6da883d783"
};
// Spark-only v2.1 detects Anonymous Auth + Firestore rules at runtime. No readiness flag.
// config=null remains a fully offline mode; Analytics and Cloud Functions are not used.
