const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongoose  = require('mongoose');
dotenv.config();
const PORT = process.env.PORT || 5000


// Import routes
//onst authRoute = require('./routes/auth');


////// URL FOR THE PROJECT
const prodUrl = `http://127.0.0.1:${PORT}`
const liveUrl =  `${process.env.currentUrl}:${PORT}`
const currentUrl = liveUrl ||  prodUrl  

//// DATABSE URL local: process.env.MONGODB_URI ||| cloud:process.env.databaseUrl 
const dbUrl = process.env.databaseUrl || process.env.MONGODB_URI


// Database connection
mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
/// db connection error
db.on('error', (error) => {
  console.error('Connection error:', error);
});
//// db connecrion status.Successful alert
db.once('open', () => {
  console.log('Connection to MongoDB successful!');
});
//// db connecrion status.failure  alert
db.once('close', () => {
  console.log('Connection to MongoDB disconnected.');
});


app.get('/', (req, res) =>{
    res.send( `connected via ${currentUrl}`)
})


// Routes middlewares
//app.use('/api/auth', authRoute);

app.listen(PORT, ()=>{
  console.log(`Connected on PORT ${PORT} || ${currentUrl}`)
})