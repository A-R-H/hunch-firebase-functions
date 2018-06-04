const functions = require("firebase-functions");
const firebase = require("firebase");
require("firebase/firestore");
const cors = require("cors")();
const { firebaseConfig } = require("./config");

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
      .doc(`${uid}`)
      .get()
      .then(doc => {
        if (!doc.exists) {
          console.log(`request for ${uid} data failed`);
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
    const { event } = req.body.currentEvent; // see how dan will sent event data

    return db
      .collection("Current_Event")
      .add(event)
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
    const nextEvent = eventsRef.orderBy("date", "desc").limit(1);
    nextEvent
      .get()
      .then(snap => {
        snap.forEach(doc => {
          res.send({ data: doc.data(), id: doc.id });
        });
      })
      .catch(err => {
        console.log("error getting next event", err);
        res.send(err);
      });
  });
});

exports.addEventToEvents = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    console.log(req.body, 'req.body');
    const newEvent = req.body.event;
    const eventName = req.body.eventName;
    const eventsRef = db.collection("Events").doc("AllEvents");

    const events = {};
    events[`${eventName}`] = newEvent;

    console.log(events, 'event');

    return eventsRef
      .update(events)
      .then(() => {
        console.log("event successfully written!");
        return eventsRef.get();
      })
      .then(doc => {
        console.log(doc.data());
        const events = doc.data();
        return res.send(events);
      })
      .catch(err => {
        console.log("Error adding event to Events", err);
        res.send(err);
      });
  });
});

exports.updateQuestion = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // strip details from request body, event id, question object to update db object, question number to identify which question
    console.log(req.body);
    const eventID = req.body.eventID;
    const questionObj = req.body.questionObj;
    const questionNo = req.body.questionId;
    const eventQuestionRef = db.collection("Current_Event").doc(`${eventID}`);
    return eventQuestionRef
      .get()
      .then(doc => {
        doc = doc.data();
        console.log(doc);
        doc.event[questionNo] = questionObj;
        return doc;
      })
      .then(doc => {
        return eventQuestionRef.set(doc);
      })
      .then(() => {
        return res.send({
          message: `question${questionNo} successfully updated!`
        });
      })
      .catch(err => {
        console.log(`Error updating question${questionNo}`, err);
        res.send(err);
      });
  });
});

exports.changeUsersTickets = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const { uid, ticketChange } = req.body;
    const userRef = db.collection("Users").doc(`${uid}`);
    let newTickets;
    const transaction = db
      .runTransaction(t => {
        return t.get(userRef).then(doc => {
          newTickets = Number(doc.data().tickets) + Number(ticketChange);
          return t.update(userRef, { tickets: newTickets });
        });
      })
      .then(result => {
        console.log("Transaction success", result);
        res.send({ tickets: newTickets });
      })
      .catch(err => {
        console.log("Transaction failure:", err);
      });
  });
});

exports.getAllEvents = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const eventsRef = db.collection("Events").doc("AllEvents");

    return eventsRef
      .get()
      .then(doc => {
        const allEvents = doc.data();
        return res.send(allEvents);
      })
      .catch(err => {
        console.log("Error retrieving all event docs", err);
        res.send(err);
      });
  });
});

exports.addUserAnswer = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const { event_id, uid, question, answer } = req.body;
    const answerRef = db.collection("Current_Event").doc(`${event_id}`);
    const transaction = db
      .runTransaction(t => {
        return t.get(answerRef).then(doc => {
          const currentAnswers = doc.data()[`answers_for_Q${question}`];
          currentAnswers[uid] = answer;
          return t.update(answerRef, {
            [`answers_for_Q${question}`]: currentAnswers
          });
        });
      })
      .then(result => {
        console.log("Transaction success", result);
        res.send({ msg: "success" });
      })
      .catch(err => {
        console.log("Transaction failure:", err);
        res.send({ msg: "failure" });
      });
  });
});
