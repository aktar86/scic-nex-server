const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

//middleware
app.use(express.json());
app.use(cors());

//mongodb
const uri = `${process.env.GG_DB_URI}`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();

    const db = client.db("gadget_grove_db");
    const productCollection = db.collection("products");

    app.get("/products", async (req, res) => {
      try {
        const cursor = productCollection.find().sort({ createdAt: -1 });
        const products = await cursor.toArray();
        res.status(200).send({
          status: 200,
          count: products.length,
          products,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          message: "Server error",
        });
      }
    });

    //get single product api
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;

      // ObjectId validation
      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ error: "Invalid product ID" });
      }

      const result = await productCollection.findOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });
    //product add api
    app.post("/products", async (req, res) => {
      try {
        const product = req.body;

        // basic validation
        if (!product?.name || !product?.price || !product?.category) {
          return res.status(400).send({
            message: "Missing required fields",
          });
        }

        const newProduct = {
          ...product,
          price: Number(product.price),
          rating: Number(product.rating) || 0,
          stock: Number(product.stock) || 0,
          createdAt: new Date(),
        };

        const result = await productCollection.insertOne(newProduct);

        res.status(201).send({
          message: "Product added successfully",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          message: "Server error",
        });
      }
    });

    // Send a ping
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("next server api running");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
