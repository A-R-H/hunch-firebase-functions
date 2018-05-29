const functions = require("firebase-functions");
const firebase = require("firebase");
require("firebase/firestore");
const { firebaseConfig } = require("../config");

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
