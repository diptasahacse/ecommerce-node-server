const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Middleware function to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
    res.status(401).json({ error: "Unauthorized" });
  }

  jwt.verify(token, "secretKey", (err, user) => {
    if (err) {
      res.status(403).json({ error: "Forbidden" });
    };
    req.user = user;
    next();
  });
}


const uri = `mongodb+srv://${process.env.MONGODB_USER_NAME}:${process.env.MONGODB_PASSWORD}@cluster0.zjuzyl5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    await client.connect();

    // table name
    const Product = client.db("ecommerce").collection("products");

    const User = client.db("ecommerce").collection("users");


    // Register route
    app.post("/register", async (req, res) => {
      // Check if user already exists
      const { name, email, password } = req.body;
      
      const isUser = await User.findOne({ email });
      if (isUser) return res.status(400).json({ error: "User already exists"});

      // Hash password
      const salt = await bcrypt.genSalt(10);
      hashPassword = await bcrypt.hash(password, salt);

      // Create new user
      const user = {
        name,email,password: hashPassword
      }

      // Save user to database
      await User.insertOne(user, (err, result) => {
        if (err) {
          console.log(err);
        } else {
          res.send(result);
        }

        console.log(`Inserted document with ID ${result.insertedId}`);
    
        // Close the connection to the MongoDB server
        client.close();
      });

      // Generate JWT token
      const token = jwt.sign({ _id: user._id }, "secretKey", {
        expiresIn: '30d',
      });

      // delete user.password;
      user.password = undefined;

      res.status(201).json({
        message: "User created successfully",
        token,
        user
      });      
    });

    // Login route
    app.post("/login", async (req, res) => {
      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: "Invalid email or password." });

      // Check if password is correct
      const validPassword = await bcrypt.compare(password, user.password); 
      if (!validPassword) return res.status(400).json({ error: "Invalid email or password." });

      // Generate JWT token
      const token = jwt.sign({ _id: user._id }, "secretKey", {
        expiresIn: '30d',
      });

      // delete user.password;
      user.password = undefined;

      res.status(200).json({
        message: "User logged in successfully",
        token,
        user
      });
    });

    // All Products
    app.get("/products", async (req, res) => {
      const query = {};
      const productsArray = await Product.find(query).toArray();

      res.send(productsArray);
    });

    // Create Product - Insert Data
    app.post("/product", authenticateToken, async (req, res) => {
      const product = req.body;
      const result = await Product.insertOne(product);
      res.send(result);
    });

    // Remove Product by ID
    app.delete("/product/:id", authenticateToken, async (req, res) => {
      const productID = req.params.id;
      console.log(productID);
      const query = { _id: new ObjectId(productID) };
      const result = await Product.deleteOne(query);
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
