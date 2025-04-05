const firebaseConfig = {
//enter your firebase api
 
};

firebase.initializeApp(firebaseConfig);

// Function to set custom claims for admin users
async function setAdminRole(userId) {
  const user = await firebase.auth().getUser(userId);
  await firebase.auth().setCustomUserClaims(userId, { admin: true });
  console.log(`Admin role set for user: ${user.email}`);
}
