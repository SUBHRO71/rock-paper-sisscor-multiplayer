import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCt3EpXEuHUlLtntB71HMQp81Dvnkq_vIA",
  authDomain: "rps-multiplayer-20bf1.firebaseapp.com",
  projectId: "rps-multiplayer-20bf1",
  storageBucket: "rps-multiplayer-20bf1.firebasestorage.app",
  messagingSenderId: "824080721494",
  appId: "1:824080721494:web:e331132c88c79fd8d8bdf7",
  measurementId: "G-GPRTEYNSP8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();