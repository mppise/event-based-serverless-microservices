'use strict';
// const rollout = "development";
const rollout = "production";

const PORT = 8080;
const HOST = '0.0.0.0';

const version = require('./package.json').version;

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// -- CORS enable
app.use(function (req, res, next) {
    console.log(new Date().getTime().toString() + " : Received request on " + req.path);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// -- Setup database client
const admin = require("firebase-admin");
const serviceAccount = require("./onlinestore-com-firebase-adminsdk-46vbe-6b9f731e05.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// -- Setup Google Pub/Sub
const { PubSub } = require('@google-cloud/pubsub');
const pubSubClient = new PubSub({ projectId: "onlinestore-com", keyFilename: "./onlinestore-com-a5104f948813.json" });
let TOPIC = "projects/onlinestore-com/topics/order_created";

// -- Ping
app.get('/ping', (req, res) => {
    res.send(`<div style="text-align:center;margin-top:20%;">
    <h1>Order</h1>
    <p>Order microservices for Online Store</p>
    <hr>
    <p>Version: <em>${version}</em></p>
    </div>`);
});

// -- Empty orders table
app.post('/prepare', (req, res) => {
    db.collection('orders').get().then((snap) => {
        if (snap.empty)
            console.log("Orders is already prepared");
        else {
            snap.forEach((doc) => {
                doc.ref.delete();
            });
            console.log("Orders is now prepared");
        }
        res.status(200).json({ "prepared": true });
    }).catch((err) => {
        console.log(err);
        res.status(200).json(err);
    });
});

// -- Create new order
app.post('/', (req, res) => {
    let order = {
        order_id: new Date().getTime().toString(),
        order_date: new Date().getTime(),
        items: req.body.items,
        total: req.body.total
    };
    db.collection('orders').add(order)
        .then((ref) => {
            let event = pubSubClient.topic(TOPIC);
            let data = JSON.stringify(order);
            event.publish(Buffer.from(data))
                .then((messageID) => console.log(messageID))
                .catch((err) => console.log(err));
            res.status(200).json({ "confirmation": ref.id });
        });
});

// -- Retrieve all orders
app.get('/', (req, res) => {
    let orders = [];
    db.collection('orders').get().then((snap) => {
        if (snap.empty)
            console.log("> Found 0 orders");
        else {
            snap.forEach((doc) => {
                orders.push(doc.data());
            });
            console.log("> " + orders.length + " orders found");
            res.status(200).json(orders);
        }
    }).catch((err) => {
        console.log(err);
        res.status(200).json(err);
    });
});

// -- Retrieve order with order_id
app.get('/:id', (req, res) => {
    db.collection('orders').where('order_id', '==', req.params['id']).get()
        .then((snap) => {
            if (snap.empty)
                res.status(200).json({});
            else {
                let order;
                snap.forEach((doc) => {
                    order = doc.data();
                });
                console.log(order);
                res.status(200).json(order);
            }
        }).catch((err) => {
            console.log(err);
            res.status(200).json(err);
        });
});

app.listen(PORT, HOST);
console.log(`Order: Ready`);