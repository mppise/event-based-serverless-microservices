# OnlineStore

OnlineStore is a containerized application that runs on GCP Serverless infrastructure. This is an example to demonstrate event-based, serverless microservices based application development and deployment methodology. Business logic tier is split into multiple business microservices (i.e. product, order and invoice) to demonstrate how each microservice can be scaled independently of another. Order microservice works with messaging infrastructure to invoke Invoice microservice.

**High-Level Assumptions**

- There is no user authentication in place.
- All users can see all products and all orders.
- Order does not contain user details (e.g. Name, Shipping details, Payment information, etc.)
- There is just one single database. Database level high availavility is out of scope here (since it would highly depend on type of the database used).
- GCP Storage (GCS) bucket is open for public access to make accessing PDFs simpler via the frontend application (only for sake of this example).

---

The application architecture consists of 4 tiers:

#### DB
The DB layer is a Google Firestore database that contains collections for storing products and orders.


#### APP
The APP layer is nodejs based application that provides APIs. The APIs are consumed in the UI layer and interact with the DB layer to retrieve products and create orders.
Each business component (i.e. product and order) is separated into individual microservice to demonstrate independent scalability.


#### UI
The UI layer is a lean Ionic based ([progressive](https://ionicframework.com/docs/angular/pwa)) web application that provides an interface to list products and orders and place new orders. 


#### MESSAGING INFRASTRUCTURE
Google Cloud Pub/Sub service is leveraged to provide the messaging capabilities. Only 1 topic (i.e. order_created) is used in the entire example. A subscription on this topic performs invocation of the Invoice microservice to geenrate a PDF invoice (Credit: Invoiced for providing the invoice-generator api).
