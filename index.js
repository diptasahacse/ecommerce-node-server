const express = require("express");
const app = express();
const cors = require("cors");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.MONGODB_USER_NAME}:${process.env.MONGODB_PASSWORD}@cluster0.zjuzyl5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    await client.connect();

    const productsCollection = client.db("ecommerce").collection("products");

    // All Products
    app.get("/products", async (req, res) => {
      const query = {};
      const productsArray = await productsCollection.find(query).toArray();

      res.send(productsArray);
    });

    // Create Product - Insert Data
    app.post("/product", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });
  } finally {
    // await client.close() ;
  }
};
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
