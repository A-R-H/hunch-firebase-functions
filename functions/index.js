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
        if (!doc.exists) {
          res.send({ err: "Invalid uid" });
        } else {
          console.log(`request for ${uid} data`);
          res.send(doc.data());
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

    return db
      .collection("Current_Event")
      .add({ event })
      .then(docRef => {
        return res.json({
          result: `Event entry with ID: ${docRef.id} added.`,
          eventID: docRef.id
        });
      });
  });
});


exports.getNextEvent = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const eventsRef = db.collection("Current_Event");
    const query = eventsRef
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          console.log(doc.id, "=>", doc.data());
        });
      })
      .catch(err => {
        console.log("Error getting documents", err);
        res.send(err);
      });
  });
});

exports.addEventToEvents = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
      const newEvent = req.body.event
      const eventName= req.body.eventName
      const eventsRef = db.collection('Events').doc('AllEvents');
      
      const events = {}
      events[`${eventName}`] = newEvent

      return eventsRef.update(events).then(() => {
          console.log('event successfully written!');
          return eventsRef.get();
      }).then(doc => {
          console.log(doc.data());
          const events = doc.data()
          return res.send(events)
      }).catch((err) => {
          console.log('Error adding event to Events',err);
          res.send(err);
      }) 
  })
})

exports.updateQuestion = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
      // strip details from request body, event id, question object to update db object, question number to identify which question
      console.log(req.body);
      const eventID = req.body.eventID;
      const questionObj = req.body.questionObj;
      const questionNo = req.body.questionId
      const eventQuestionRef = db.collection('Current_Event').doc(`${eventID}`);
      return eventQuestionRef.get().then(doc => {
          doc = doc.data();
          console.log(doc);
          doc.event[questionNo] = questionObj;
          return doc;
      }).then(doc => {
          return eventQuestionRef.set(doc);
      }).then(() => {
          return res.send({message: `question${questionNo} successfully updated!`});
      }).catch(err => {
          console.log(`Error updating question${questionNo}`, err);
          res.send(err);
      }); 
   }); 
});