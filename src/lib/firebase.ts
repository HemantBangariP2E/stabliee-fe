// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1sK53feCqP7f0fSmTspBdF0-8E4b76Fg",
  authDomain: "my-earning-9bff1.firebaseapp.com",
  databaseURL: "https://my-earning-9bff1.firebaseio.com",
  projectId: "my-earning-9bff1",
  storageBucket: "my-earning-9bff1.firebasestorage.app",
  messagingSenderId: "621751248964",
  appId: "1:621751248964:web:41fc91304b9a761c6cf411"
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);