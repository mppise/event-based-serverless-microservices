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

// -- Ping
app.get('/ping', (req, res) => {
    res.send(`<div style="text-align:center;margin-top:20%;">
    <h1>Product</h1>
    <p>Product microservices for Online Store</p>
    <hr>
    <p>Version: <em>${version}</em></p>
    </div>`);
});

// -- Populate schema.Products with standard product master
app.post('/prepare', (req, res) => {
    let insertProducts = () => {
        let products = require('./product-master.json');
        let productID = Math.floor(Math.random() * Math.floor(100 - 10) + 10);
        products.forEach((product) => {
            product['product_id'] = "P00" + productID;
            productID++;
            db.collection('products').add(product).then(() => {
                console.log("> " + product['product_id'] + " inserted...");
            }).catch((err) => {
                console.log("!! Could not insert " + productID + " : " + JSON.stringify(err));
            });
        }); // forEach
        console.log(".. Done");
    };
    db.collection('products').get()
        .then((snap) => {
            if (snap.empty) {
                insertProducts();
                res.status(200).json();
            }
            else {
                res.status(200).json({ "prepared": true });
            }
        }).catch((err) => res.status(200).json(err));
});

// -- Retrieve all products
app.get('/', (req, res) => {
    let products = [];
    db.collection('products').get().then((snap) => {
        if (snap.empty)
            console.log("> Found 0 products");
        else {
            snap.forEach((doc) => {
                products.push(doc.data());
            });
            console.log("> " + products.length + " products found");
            res.status(200).json(products);
        }
    }).catch((err) => {
        console.log(err);
        res.status(200).json(err);
    });
});

// -- Retrieve product with product_id
app.get('/:id', (req, res) => {
    db.collection('products').where('product_id', '==', req.params['id']).get()
        .then((snap) => {
            if (snap.empty)
                res.status(200).json({});
            else {
                let product;
                snap.forEach((doc) => {
                    product = doc.data();
                });
                console.log(product);
                res.status(200).json(product);
            }
        }).catch((err) => {
            console.log(err);
            res.status(200).json(err);
        });
});

app.listen(PORT, HOST);
console.log(`Product: Ready`);