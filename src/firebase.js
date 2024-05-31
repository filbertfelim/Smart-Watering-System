import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBmNxJTuGaLXOs68B2btz2fSJ1IcgbWHLU",
  authDomain: "reksti-6185d.firebaseapp.com",
  databaseURL:
    "https://reksti-6185d-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "reksti-6185d",
  storageBucket: "reksti-6185d.appspot.com",
  messagingSenderId: "493712448054",
  appId: "1:493712448054:web:c18eac661214ac4da15697",
  measurementId: "G-YKX0PC0MYZ",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
