const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;

//port config
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${dbUser}:${dbPass}@cluster1.ycn4y5y.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const toysCollection = client.db("pixiepia").collection("toys");

    //load all toys
    app.get("/toys", async (req, res) => {
      const toys = await toysCollection.find({}).toArray();
      res.send(toys);
    });

    // load by email
    app.get("/mytoys/:email", async (req, res) => {
      const toys = await toysCollection
        .find({
          sellerEmail: req.params.email,
        })
        .limit(20)
        .toArray();
      res.send(toys);
    });

    // load single Toy
    app.get("/toy/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.findOne(query);
      res.send(result);
    });

    //Add to database
    app.post("/toys", async (req, res) => {
      const toysData = req.body;
      toysData.createAt = new Date();
      const result = await toysCollection.insertOne(toysData);
      res.send(result);
    });

    //update database
    app.patch("/toy/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const toyData = req.body;
      console.log(toyData);
      const {
        toyName,
        description,
        price,
        availableQuantity,
        category,
        subCategory,
        brand,
        material,
        color,
        weight,
        countryOfOrigin,
        pictureUrl,
        ageRange,
        detailDescription,
        date,
      } = toyData;
      const updateToyData = {
        $set: {
          toyName,
          description,
          price,
          availableQuantity,
          category,
          subCategory,
          brand,
          material,
          color,
          weight,
          countryOfOrigin,
          pictureUrl,
          ageRange,
          detailDescription,
          date,
        },
      };
      console.log(updateToyData);
      const result = await toysCollection.updateOne(
        filter,
        updateToyData,
        options
      );
      res.send(result);
    });
    // Delete
    app.delete("/toy/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.deleteOne(query);
      res.send(result);
    });

    //Search toys
    app.get("/search/:text", async (req, res) => {
      const searchText = req.params.text;
      console.log(searchText);
      const result = await toysCollection
        .find({
          $or: [{ toyName: { $regex: searchText, $options: "i" } }],
        })
        .toArray();
      res.send(result);
    });

    //sort by price
    app.get("/sort_toys/:email", async (req, res) => {
      const { email } = req.params;
      const { sort } = req.query;
      let sortOption = {};
      if (sort === "asc") {
        sortOption = { price: 1 };
      } else if (sort === "desc") {
        sortOption = { price: -1 };
      }
      const result = await toysCollection
        .find({ sellerEmail: email })
        .sort(sortOption)
        .toArray();

      res.send(result);
    });

    //filter by price
    app.get("/filter_price", async (req, res) => {
      const { maxPrice, minPrice } = req.query;
      console.log(minPrice, parseInt(maxPrice));
      const result = await toysCollection
        .find({
          price: { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) },
        })
        .sort({ price: 1 })
        .toArray();
      res.send(result);
    });

    //count toydata
    app.get("/total", async (req, res) => {
      const count = await toysCollection.estimatedDocumentCount();
      res.send({ total: count });
    });

    //pagination
    app.get("/page", async (req, res) => {
      const pageNumber = parseInt(req.query.page) || 1;
      const pageSize = 20;
      const skipCount = (pageNumber - 1) * pageSize;
      const results = await toysCollection
        .find()
        .skip(skipCount)
        .limit(pageSize)
        .toArray();
      const totalCount = await toysCollection.countDocuments();
      const totalPages = Math.ceil(totalCount / pageSize);

      const response = {
        results,
        page: pageNumber,
        pageSize,
        totalCount,
        totalPages,
      };

      res.json(response);
    });

    // Send a ping to confirm a successful connection
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
  res.send("Pixiepia server is running");
});

app.listen(port, () => {
  console.log(`Pixiepia server is running on port ${port}`);
});
