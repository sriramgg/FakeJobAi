// assets/js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAKtNnpQHdLKFN0D5vmda96zlMPDgrEoes",
  authDomain: "sign-ed6c2.firebaseapp.com",
  projectId: "sign-ed6c2",
  storageBucket: "sign-ed6c2.appspot.com",
  messagingSenderId: "155178314987",
  appId: "1:155178314987:web:b31d722393e3d8ebcc62ae",
  measurementId: "G-P6Y93V1L4K"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
