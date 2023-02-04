// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBDwf28U_qAahOn2SHxXNZUQa04IG0_86o",
  authDomain: "realtor-clone-react-14407.firebaseapp.com",
  projectId: "realtor-clone-react-14407",
  storageBucket: "realtor-clone-react-14407.appspot.com",
  messagingSenderId: "801141845845",
  appId: "1:801141845845:web:7c9d5bef299787dd3d89dc"
};

// Initialize Firebase
initializeApp(firebaseConfig);
export const db = getFirestore()
