import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAmhM_FkQ4Oo40rUPv1B1xqzDHyBuXh47I",
  authDomain: "proj-mic-d4567.firebaseapp.com",
  projectId: "proj-mic-d4567",
  storageBucket: "proj-mic-d4567.appspot.com",
  messagingSenderId: "910738020178",
  appId: "1:910738020178:web:e06ef6dca2d8a07ce80c8b",
  measurementId: "G-LPSLFK9YE9"
};


// Validate config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn(
    "Firebase config incomplete. Google login will not work. Check .env file."
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: "select_account", // Force account selection every time
});

export default app;
