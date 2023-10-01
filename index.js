const express = require('express');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://new-Commerce:LPrtQq4xyj5I6k6X@cluster0.kjebueb.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
      serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
      }
});
async function run() {
      const productCollection = client.db("commerceDB").collection("products")
      const cartCollection = client.db("commerceDB").collection("carts")
      //product api
      app.post("/addProduct", async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product)
            res.send(result)
      })
      //filter 
      app.get("/products", async (req, res) => {
            const query = req.query
            const filter = {}
            if (query.search && query.category) {
                  filter.name = { $regex: req.query.search, $options: "i" }
                  filter.category = query.category
            }
            else if (query.search) {
                  filter.name = { $regex: req.query.search, $options: "i" }
            }
            else if (query.category) {
                  filter.category = query.category
            }
            const result = await productCollection.find(filter).toArray()
            res.send(result)
      })

      //cart api

      app.post("/addCart", async (req, res) => {
            const cartItem = req.body;
            const filter = { productId: cartItem.productId }
            const existItem = await cartCollection.findOne(filter)
            if (!existItem) {
                  cartItem.quantity -= 1
                  cartItem.orderQuantity = 1
                  const result = await cartCollection.insertOne(cartItem)
                  res.send(result)
            }
            else {
                  const updateCart = { ...existItem, quantity: existItem.quantity - 1, orderQuantity: existItem.orderQuantity + 1 }
                  const result = await cartCollection.updateOne(filter, { $set: updateCart });
                  res.send(result)
            }

      })

      app.get("/getCart", async (req, res) => {
            const result = await cartCollection.find().toArray()
            res.send(result)
      })

      app.patch("/incrementCart/:id", async (req, res) => {
            const id = req.params.id
            const filter = { productId: id }
            const existProduct = await cartCollection.findOne(filter)
            if (existProduct) {
                  const updateCart = { ...existProduct, orderQuantity: existProduct.orderQuantity + 1 }
                  const result = await cartCollection.updateOne(filter, { $set: updateCart })
                  res.send(result)
            }
      })
      app.patch("/decrementCart/:id", async (req, res) => {
            const id = req.params.id
            const filter = { productId: id }
            const existProduct = await cartCollection.findOne(filter)
            if (existProduct.orderQuantity > 1) {
                  const updateCart = { ...existProduct, orderQuantity: existProduct.orderQuantity - 1 }
                  const result = await cartCollection.updateOne(filter, { $set: updateCart })
                  res.send(result)
            }
            else {
                  const result = await cartCollection.deleteOne(filter)
                  res.send(result)
            }
      })
      app.delete("/deleteCart/:id", async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(filter)
            res.send(result)
      })

      try {
            await client.connect();
            await client.db("admin").command({ ping: 1 });
            console.log("Pinged your deployment. You successfully connected to MongoDB!");
      } finally {
            // Ensures that the client will close when you finish/error
            // await client.close();
      }
}
run().catch(console.dir);
app.get("/", (req, res) => {
      res.send("New Commerce Coming")
})
app.listen(port, () => {
      console.log(`Example app listening on port ${port}`)
})


//commerceDB