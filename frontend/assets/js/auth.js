// assets/js/auth.js
import { auth, provider } from "./firebase-config.js";
import { signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const googleBtn = document.getElementById("googleLogin");
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      try {
        const result = await signInWithPopup(auth, provider);
        alert(`Welcome ${result.user.displayName}`);
      } catch (error) {
        console.error(error);
        alert(`Error: ${error.message}`);
      }
    });
  }
});
