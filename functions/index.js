const functions = require("firebase-functions");
const firebase = require("firebase");
require("firebase/firestore");
const cors = require("cors")();
const { firebaseConfig } = require("./config");
const { refineUserInfo } = require("./utils");

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
// const admin = require ('firebase-admin');
// admin.initializeApp(functions.config().firebase);

// const db = admin.firestore();

exports.addUser = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const { uid, username, email, creation_time } = req.body;
    db
      .collection("Users")
      .doc(`${uid}`)
      .set({
        username,
        email,
        creation_time,
        tickets: 0
      })
      .then(docRef => {
        //docRef is undefined??
        console.log("docRef", docRef);
        console.log(`Added user ${uid} to database`);
        res.send({ docRef, err: null });
      })
      .catch(err => {
        res.send({ err });
      });
  });
});

exports.getUserInfo = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const { uid } = req.query;
    db
      .collection("Users")
      .doc(uid)
      .get()
      .then(doc => {
        if (doc) {
          console.log(`request for ${uid} data`);
          const userInfo = refineUserInfo(
            doc._document.data.internalValue.root
          );
          res.send(userInfo);
        } else {
          res.send({ err: "Invalid uid" });
        }
      })
      .catch(err => {
        console.log(`Error getting document for user ${uid}`, err);
        res.send(err);
      });
  });
});

// exports.sendQuestion = functions.firestore
//   .document("Current_Event/{event_id}")
//   .onUpdate((change, context) => {
//     // Get an object representing the document
//     // e.g. {'name': 'Marie', 'age': 66}
//     const newValue = change.after.data();

//     // ...or the previous value before this update
//     const previousValue = change.before.data();

//     // access a particular field as you would any JS property
//     const name = newValue.name;

//     // perform desired operations ...
//   });


exports.createCurrentEvent = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
      const event = req.body.currentEvent; // see how dan will sent event data
  
      return db.collection('Current_Event').add({event})
      .then(docRef => {
          return res.json({
              result: `Event entry with ID: ${docRef.id} added.`,
              eventID: docRef.id
          });
      });   
  })
});


