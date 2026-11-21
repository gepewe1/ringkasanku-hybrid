/* Firebase web config — the author's own dedicated hackathon project
 * "ringkasanku-hybrid" (free Spark plan, created for #BuildHybridAI).
 *
 * A web apiKey in a Firebase config is NOT a secret (it identifies the
 * project; access is governed by App Check + Firebase rules). AI Logic
 * (Gemini Developer API) is enabled on this project and App Check is
 * registered and ENFORCED via the Fraud Defense (reCAPTCHA Enterprise)
 * provider — see the site key below. This is a throwaway hackathon
 * project, not a production project.
 */
/* FILLED 2026-11-21 with Yuga's hackathon project "ringkasanku-hybrid"
 * (Spark plan) — values copied from his Firebase console screenshot.
 * AI Logic (Gemini Developer API) still needs enabling in the console. */
export const firebaseConfig = {
  apiKey: "AIzaSyDel6tkNLOHmB1rP4aGpy7b5ucKUEZOkgs",
  authDomain: "ringkasanku-hybrid.firebaseapp.com",
  projectId: "ringkasanku-hybrid",
  storageBucket: "ringkasanku-hybrid.firebasestorage.app",
  messagingSenderId: "188357501900",
  appId: "1:188357501900:web:1965998eb744862e10f369",
  measurementId: "G-JV4FKTERPJ"
};

/* reCAPTCHA v3 SITE key (public by design — it ships in the client code).
 * Registered 2026-11-21 for domains: localhost, 127.0.0.1,
 * ringkasanku-hybrid.web.app, ringkasanku-hybrid.firebaseapp.com,
 * gepewe1.github.io. The matching SECRET key lives only in the Firebase
 * Console App Check registration — never in this repo. */
export const recaptchaSiteKey = "6LcjWCsuAAAAANIhBGInLe8ve4aOXOQOjFXgAL5S";
