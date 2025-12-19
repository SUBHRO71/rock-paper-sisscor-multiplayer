import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

export const listenToAuth = (callback) => {
  return onAuthStateChanged(auth, callback);
};
