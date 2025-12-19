import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR API KEY",
  authDomain: "_",
  projectId: "PROJECT ID",
  storageBucket: "_",
  messagingSenderId: "_",
  appId: "_",
  measurementId: "_"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
