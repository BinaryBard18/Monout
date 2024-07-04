import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCMcZsFrrbCFa_APU3y2ORC1f3kThJBWmM",
  authDomain: "monout-20006.firebaseapp.com",
  projectId: "monout-20006",
  storageBucket: "monout-20006.appspot.com",
  messagingSenderId: "641994870503",
  appId: "1:641994870503:web:e3c982cbb67eba50485c42"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth();

export const googleAuthProvider = new GoogleAuthProvider();

export const db = getFirestore(app);


export default app;