const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors')


const app = express();

mongoose.connect(process.env.MONGO_URI)
    .catch(error => console.log(`DB Connection error: ${error}`));
const con = mongoose.connection;

//handle error while opening dbb 

con.on('open', error => {
    if (!error)
        console.log('DB Connection Succesful');
    else
        console.log(`Error Connecting to DB: ${error}`);
})

// handle mongoose disconnect from mongodb

con.on('disconnected', error => {
    console.log(`Mongoose lost connection with MongoDB:${error}`)
})

// parse Json data coming in the request body 
app.use(express.json());
app.use(cors());


// gain access to my routes
app.use("/auth", require('./routes/auth'));
app.use("/authenticateUser", require('./routes/authenticateUser'))

const PORT = process.env.PORT 

app.listen(PORT, () => console.log(`server running on port ${PORT}`)
);