// assets/js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAh7MNkltNC56CczIaI3e0Cm_x4Vp2OkCQ",
  authDomain: "fakejobaidetection.firebaseapp.com",
  projectId: "fakejobaidetection",
  storageBucket: "fakejobaidetection.firebasestorage.app",
  messagingSenderId: "1082183297442",
  appId: "1:1082183297442:web:833686742f461f4897eafb",
  measurementId: "G-5PFBP2YBHK"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
