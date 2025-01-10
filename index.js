const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
require('dotenv').config()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');




app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://tutorhive-e3caf.web.app',
        'https://tutorhive-e3caf.firebaseapp.com',
    ],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());


const verifyToken = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded;
        next();
    })
   

}


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


        app.post("/jwt", async (req, res) => {

            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '5h'
            });
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                })
                .send({ success: true })
          });

        app.post('/logout', (req, res) => {
            res
                .clearCookie('token', {
                    maxAge: 0,
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                })
                .send({ success: true })
        })
      


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
            try {
              const countQuery = req.query.count;
              const category = req.query.category;
          
              // Case 1: If the 'count' query parameter is provided, return statistics
              if (countQuery) {
                const [documentCount, distinctCategory] = await Promise.all([
                  tutorCollection.countDocuments(), // মোট ডকুমেন্ট সংখ্যা
                  tutorCollection.aggregate([
                    { $group: { _id: "$category" } },
                    { $count: "distinctCount" }
                  ]).toArray()
                ]);
          
                return res.send({
                  totalDocuments: documentCount.toString(),
                  distinctCategoryCount: distinctCategory.length > 0 ? distinctCategory[0].distinctCount : 0,
                });
              }
          
              // Case 2: If the 'category' query parameter is provided, return tutors filtered by category
              if (category) {
                const tutors = await tutorCollection.find({ category }).toArray();
                return res.send(tutors);
              }
          
              // Case 3: If no query parameters, return all tutors
              const allTutors = await tutorCollection.find().toArray();
              return res.send(allTutors);
          
            } catch (error) {
              console.error("Error fetching data:", error);
              res.status(500).send("Internal Server Error");
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

        app.get('/book-tutors', verifyToken, async (req, res) => {
            const emailFromQuery = req.query.email;  
            const emailFromToken = req.user.email;  
        
            
            if (emailFromQuery !== emailFromToken) {
                return res.status(403).send({ message: 'Forbidden access: email mismatch' });
            }
        
            const query = { email: emailFromQuery }; 
        
            try {
                const result = await bookTutorCollection.find(query).toArray();
                res.send(result);  // Send the result back to the client
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Error fetching data' });
            }
        });
        
        app.get('/tutors/email/:email', verifyToken, async (req, res) => {
            const emailFromParam = req.params.email;
            const emailFromToken = req.user.email; 
    
            if (emailFromParam !== emailFromToken) {
                return res.status(403).send({ message: 'Forbidden access' });
            }
        
            try {
                const query = { email: emailFromParam };
                const result = await tutorCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Error fetching tutor data' });
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
            const id = req.params.id; 
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
    console.log(`TutorHive is running on port: ${port}`);

})
 