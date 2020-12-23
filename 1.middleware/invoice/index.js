'use strict';
// const rollout = "development";
const rollout = "production";

const PORT = 8080;
const HOST = '0.0.0.0';

const version = require('./package.json').version;

const express = require('express');
const app = express();
var bodyParser = require('body-parser');

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

// -- Setup storage client
const { Storage } = require('@google-cloud/storage');
const storage = new Storage({ projectId: "onlinestore-com", keyFilename: "./onlinestore-com-a5104f948813.json" });
const bucket = storage.bucket('gs://onlinestore-com.appspot.com');

// -- Invoice Generator
// -- https://github.com/Invoiced/invoice-generator-api
// -- https://github.com/Invoiced/invoice-generator.js
const https = require("https");
const fs = require("fs");

// -- Ping
app.get('/ping', (req, res) => {
    res.send(`<div style="text-align:center;margin-top:20%;">
    <h1>Invoice</h1>
    <p>Invoice microservices for Online Store</p>
    <hr>
    <p>Version: <em>${version}</em></p>
    </div>`);
});

// -- Generate new invoice
app.post('/', (req, res) => {
    let messageData = JSON.parse(Buffer.from(req.body.message.data, 'base64').toString('utf-8'));
    let items = [];
    messageData.items.forEach((item) => {
        items.push({
            name: item.name,
            quantity: 1,
            unit_cost: item.price
        });
    });
    let invoice = {
        logo: "https://onlinestore-com.web.app/assets/icons/online-shopping-cart.png",
        from: "OnlineStore.com\n1 Aquarius Constellation\nMilky Way, SPACE 235605-065950",
        to: "John Doe",
        currency: "USD",
        number: messageData.order_id,
        payment_terms: "NET 100",
        items: items,
        notes: "Thanks for being an awesome customer!",
        terms: "Please pay in full."
    };
    console.log(invoice);
    const generateInvoice = (invoice, filename) => {
        return new Promise((resolve, reject) => {
            var postData = JSON.stringify(invoice);
            var options = {
                hostname: "invoice-generator.com",
                port: 443,
                path: "/",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(postData)
                }
            };
            let file = bucket.file(filename).createWriteStream();
            let req = https.request(options, function (res) {
                res.on('data', (chunk) => {
                    file.write(chunk);
                }).on('end', () => {
                    file.end();
                    resolve();
                }).on('error', (err) => {
                    reject(err);
                });
            });
            req.write(postData);
            req.end();
        });
    };
    generateInvoice(invoice, messageData.order_id + '.pdf')
        .then(() => {
            let invoiceURL = bucket.file(messageData.order_id + '.pdf').publicUrl();
            db.collection('orders').where('order_id', '==', messageData.order_id).get()
                .then((snap) => {
                    if (snap.empty)
                        res.status(200).json({ "error": "Order ID not found" });
                    else {
                        snap.forEach((doc) => {
                            doc.ref.update({
                                "invoiceURL": invoiceURL
                            }).then((result) => {
                                res.status(200).json({ "invoiceURL": invoiceURL })
                            }).catch((err) => res.status(200).json(err));
                        });
                    }
                });
        }).catch((err) => res.status(200).json(err));
});

// -- Retrieve invoice with invoice_id
app.get('/:id', (req, res) => {
    // req.params['id]

});

app.listen(PORT, HOST);
console.log(`Invoice: Ready`);