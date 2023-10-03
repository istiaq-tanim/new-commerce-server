const express = require('express');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())
const { MongoClient, ServerApiVersion, ObjectId, LEGAL_TCP_SOCKET_OPTIONS } = require('mongodb');
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

      // app.get("/products", async (req, res) => {
      //       const query = req.query;
      //       const search = query.search || "";
      //       const category = query.category || "";
      //       const limit = parseInt(query.limit) || 3;
      //       const page = parseInt(query.page) || 1;
      //       let skip = (page - 1) * limit;
      //       const filter = {}
      //       if (search && category) {
      //             filter.name = { $regex: search, $options: "i" }
      //             filter.category = category
      //       }
      //       else if (query.search) {
      //             filter.name = { $regex: search, $options: "i" }
      //       }
      //       else if (query.category) {
      //             filter.category = category
      //       }
      //       const totalProduct=await productCollection.find(filter).toArray()
      //       const productsCount=totalProduct.length
      //       const pageCount = Math.ceil(productsCount / limit);
      //       if(page > pageCount) skip=0
      //       const products = await productCollection.find(filter).skip(skip).limit(limit).toArray()
      //       res.send({ products, productsCount, page, limit, pageCount });
      // });

      app.get("/products", async (req, res) => {
            const search = req.query.search || "";
            const category = req.query.category || ""; 
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 3;
            let skip = (page - 1) * limit;
            let filter = {}
            if (search && category) {
                  filter = {
                        $and: [
                              { name: { $regex: search, $options: "i" } },
                              { category: { $regex: category, $options: "i" } }
                        ]
                  }
            }
            else if (search) filter = { name: { $regex: search, $options: "i" } }
            else if (category) filter = { category: { $regex: category, $options: "i" } }
            const totalProduct = await productCollection.countDocuments(filter);
            const pageCount=Math.ceil(totalProduct/limit)
            if(page > pageCount) skip=0
            const products = await productCollection.find(filter).skip(skip).limit(limit).toArray();
            res.send({ products, totalProduct , pageCount ,page,limit});
      });


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