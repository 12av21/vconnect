const firebaseConfig = {
  apiKey: "AIzaSyBAZ3Zap2Q_KBCtb6OZzdmLfARO6T0lMLg",
  authDomain: "v-connect-7d896.firebaseapp.com",
  projectId: "v-connect-7d896",
  storageBucket: "v-connect-7d896.firebasestorage.app",
  messagingSenderId: "489654796371",
  appId: "1:489654796371:web:d0bf7b41970aec11d546a6",
  measurementId: "G-CBRKEL7DXS"
};

firebase.initializeApp(firebaseConfig);

// Function to set custom claims for admin users
async function setAdminRole(userId) {
  const user = await firebase.auth().getUser(userId);
  await firebase.auth().setCustomUserClaims(userId, { admin: true });
  console.log(`Admin role set for user: ${user.email}`);
}
