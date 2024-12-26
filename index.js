const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');




app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rt6v2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri);


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const tutorCollection = client.db('tutorhive').collection('tutors');
        const categoryCollection = client.db('tutorhive').collection('category');
        const bookTutorCollection = client.db('tutorhive').collection('bookTutor');



        app.post('/tutors', async (req, res) => {
            const newTutor = req.body;
            console.log(newTutor);
            const result = await tutorCollection.insertOne(newTutor);
            res.send(result);

        })
        app.post('/book-tutors', async (req, res) => {
            const bookTutor = req.body;
            console.log(bookTutor);
            const result = await bookTutorCollection.insertOne(bookTutor);
            res.send(result);

        })

        app.get('/book-tutors', async (req, res) => {
            const cursor = bookTutorCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/tutors', async (req, res) => {
            const category = req.query.category;

            if (category) {
                const tutors = await tutorCollection.find({ category }).toArray();
                res.send(tutors);
            } else {
                const tutors = await tutorCollection.find().toArray();
                res.send(tutors);
            }
        });

        app.get('/tutors/:id', async (req, res) => {
            const id = req.params.id;
            try {
                const query = { _id: new ObjectId(id) };
                const result = await tutorCollection.findOne(query);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Invalid ID or Database Error' });
            }
        });

        app.get('/book-tutors/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            try {
                const result = await bookTutorCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Error fetching data' });
            }
        });
        app.get('/tutors/email/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            try {
                const result = await tutorCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Error fetching data' });
            }
        });


        app.delete('/tutors/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await tutorCollection.deleteOne(query);
            res.send(result);
        })


        app.get('/category', async (req, res) => {
            const cursor = categoryCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        app.put('/tutors/:id', async (req, res) => {
            const id = req.params.id; // Corrected 'res' to 'req'
            const newTutor = req.body;
            const updated = {
                $set: newTutor,
            };
            const query = { _id: new ObjectId(id) };
            const options = { upsert: true };
            try {
                const result = await tutorCollection.updateOne(query, updated, options);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Error updating the tutorial' });
            }
        });



      

      








        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close(); 
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('TutorHive is running')
})

app.listen(port, () => {
    console.log(`TutorHive is running on port: ${port}`);

})