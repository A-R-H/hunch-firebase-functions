const functions = require("firebase-functions");
const firebase = require("firebase");
require("firebase/firestore");
const cors = require("cors")();
const { firebaseConfig } = require("../config");

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

exports.addUser = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const { uid, username, email, creation_time } = req.body;
    db
      .collection("Users")
      .doc(`${uid}`)
      .set({
        username,
        email,
        creation_time
      })
      .then(docRef => {
        //docRef is undefined??
        console.log("docRef", docRef);
        res.send({ docRef, err: null });
      })
      .catch(err => {
        res.send({ err });
      });
  });
});
