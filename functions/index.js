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

/*
FUNCTIONS
1. addUser
2.getUserInfo
3. createCurrentEvent
4. getNextEvent
5. addEventToEvents
6. updateQuestion
7. changeUsersTickets
8. getAllEvents
9. addUserAnswer
10. fulfillQuestion
11. deleteEvent
12. questionsToCurrentQuestions
13. CurrentEventById
14. changeLiveStatus
15. getWinnersTally

*/

// 1.
exports.addUser = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const { uid, username, email, creation_time } = req.body;
    db.collection("Users")
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

// 2.
exports.getUserInfo = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const { uid } = req.query;
    db.collection("Users")
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

// 3.
exports.createCurrentEvent = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    console.log(req.body);
    const { currentEvent } = req.body; // see how dan will sent event data

    return db
      .collection("Current_Event")
      .add(currentEvent)
      .then(docRef => {
        return res.json({
          result: `Event entry with ID: ${docRef.id} added.`,
          eventID: docRef.id
        });
      });
  });
});

// 4.
exports.getNextEvent = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const eventsRef = db.collection("Current_Event");
    const nextEvent = eventsRef.orderBy("date").limit(1);
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

// 5.
exports.addEventToEvents = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    console.log(req.body, "req.body");
    const newEvent = req.body.event;
    const eventName = req.body.eventName;
    const eventsRef = db.collection("Events").doc("AllEvents");

    const events = {};
    events[`${eventName}`] = newEvent;

    console.log(events, "event");

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

// 6.
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
        const question = doc.data();
        console.log(doc);
        question[`${questionNo}`] = questionObj;
        return question;
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

// 7.
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

// 8.
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

// 9.
exports.addUserAnswer = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const { event_id, uid, question, answer } = req.body;
    console.log("body", req.body);
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

// 10.
exports.fulfillQuestion = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const { question, event_id, correct } = req.body;
    console.log("req.body: ", req.body);
    const currentEventRef = db.collection("Current_Event").doc(event_id);
    const tallyRef = db.collection("Event_Winners").doc(event_id);
    const fulfilled = { correct };
    return currentEventRef
      .get()
      .then(doc => {
        const event = doc.data();
        const answers = event[`answers_for_Q${question}`];
        const answers_num = Number(event[question].answers_num);
        const { questions } = event;
        fulfilled.answers_num = answers_num;
        const refArr = ["a", "b", "c"];
        for (let i = 0; i < answers_num; i++) {
          fulfilled[`ans_${refArr[i]}`] = [];
        }
        for (let user in answers) {
          fulfilled[answers[user]].push(user);
        }

        return Promise.all([
          db
            .collection("Fulfilled_Questions")
            .doc(question)
            .set(fulfilled),
          db.collection("Fulfilled_Questions").get(),
          questions,
          answers,
          tallyRef.get()
        ]);
      })
      .then(([docRef, alreadyFulfilled, questions, answers, oldTally]) => {
        console.log(`Fulfilled question ${question} for event ${event_id}`);
        const howManyFulfilled = alreadyFulfilled.docs.length;
        const eventFinished = questions === howManyFulfilled;
        const tallyData = oldTally.data();
        for (let user in answers) {
          if (answers[user] === correct) {
            tallyData[user] = tallyData[user] ? tallyData[user] + 1 : 1;
          }
        }
        return Promise.all([
          tallyRef.set(tallyData),
          eventFinished,
          howManyFulfilled
        ]);
      })
      .then(([docRef, eventFinished, howManyFulfilled]) => {
        if (eventFinished) {
          currentEventRef.set({ complete: true }, { merge: true });
        }
        res.send({
          results: { [question]: fulfilled },
          howManyFulfilled,
          eventFinished
        });
      })
      .catch(err => {
        console.log(
          `Error fulfilling question ${question} for event ${event_id}`,
          err
        );
        res.send({ err });
      });
  });
});

// 11.
exports.deleteEvent = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    //req.body = JSON.parse(req.body);
    console.log(req.body);
    const eventNo = req.body.eventNo;
    const eventsRef = db.collection("Events").doc("AllEvents");

    return eventsRef
      .get()
      .then(doc => {
        const eventsObj = doc.data();
        delete eventsObj[`${eventNo}`];
        return eventsObj;
      })
      .then(doc => {
        return eventsRef.set(doc);
      })
      .then(doc => {
        console.log(doc);
        return res.send(`Event: ${eventNo} successfully deleted`);
      })
      .catch(err => {
        console.log(`Error deleting ${eventNo}`, err);
        res.send(err);
      });
  });
});

// 12.
// moves questions Current_Event to Current_Questions, need to fix Promise.all section, currently returning a array ie- [undefined, undefined etc]
exports.questionsToCurrentQuestions = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    console.log("BEFORE", req.body);
    //req.body = JSON.parse(req.body);
    console.log("after", req.body);
    const { eventID } = req.body;
    console.log("eventID:", eventID);

    const questionsRef = db.collection("Current_Event").doc(eventID);
    return questionsRef
      .get()
      .then(doc => {
        const questionsCollection = doc.data();
        const questionArr = [1, 2, 3, 4, 5, 6];

        // console.log('DOC:',doc.data());
        // console.log('arr',questionArr);
        // console.log('collection',questionsCollection);

        const moveQuestion = num => {
          return db
            .collection("Current_Questions")
            .doc(`${num}`)
            .set(questionsCollection[`${num}`]);
        };

        return Promise.all(
          questionArr.map(num => {
            return moveQuestion(num);
          })
        );
      })
      .then(questions => {
        //console.log('questions', questions);
        return res.send("Questions successfully moved to Current_Questions");
      })
      .catch(err => {
        console.log("Error adding questions from Current_Event", err);
        res.send(err);
      });
  });
});

// 13.
exports.CurrentEventById = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    //req.body = JSON.parse(req.body);
    console.log(req.body);
    const { eventID } = req.body;

    const eventsRef = db.collection("Current_Event").doc(eventID);

    return eventsRef
      .get()
      .then(doc => {
        console.log(doc.data());
        const event = doc.data();
        return res.send(event);
      })
      .catch(err => {
        console.log("Error retrieving current event", err);
        res.send(err);
      });
  });
});

// 14.
exports.changeLiveStatus = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    //req.body = JSON.parse(req.body);
    console.log("REQ", req.body);
    const { questionNo } = req.body;
    console.log("QUESTION NO", questionNo);

    const questionRef = db.collection("Current_Questions").doc(`${questionNo}`);

    return questionRef
      .get()
      .then(doc => {
        console.log("here");
        console.log("STATUS", doc.data());
        const question = doc.data();
        question["live"] = !question["live"];
        return question;
      })
      .then(question => {
        console.log("SET", question);
        return questionRef.set(question);
      })
      .then(doc => {
        return questionRef.get();
      })
      .then(doc => {
        const question = doc.data();
        console.log("SEND STATUS", question);
        return question.live;
      })
      .then(status => {
        return res.send(`Question's live status is ${status}`);
      })
      .catch(err => {
        console.log("Error changing live status");
        res.send(err);
      });
  });
});

exports.getWinnersTally = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const { event } = req.query;
    db.collection("Event_Winners")
      .doc(event)
      .get()
      .then(doc => {
        if (!doc.exists) {
          console.log(`request for ${event} data failed`);
          res.send({ err: "Invalid event id" });
        } else {
          console.log(`request for ${event} event data`);
          res.send(doc.data());
        }
      })
      .catch(err => {
        console.log(`Error getting document for event ${event}`, err);
        res.send(err);
      });
  });
});
