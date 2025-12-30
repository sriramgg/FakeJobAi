// assets/js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDH8_0jeyyiJVlQj62v2kwb0DxF3eH-Ki8",
  authDomain: "fakejobai-app.firebaseapp.com",
  projectId: "fakejobai-app",
  storageBucket: "fakejobai-app.firebasestorage.app",
  messagingSenderId: "857057101236",
  appId: "1:857057101236:web:62cd66edc86516f3d0dee1",
  measurementId: "G-1LXK6MRW21"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
