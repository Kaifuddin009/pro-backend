//require('dotenv').config({path:'./env'})
import dotenv from 'dotenv';
//import mongoose from "mongoose";
//import {DB_NAME} from "./constant";
import connectDB from "./db/index.js";
import express from "express"
import {app} from "./app.js"

dotenv.config({
    path: './.env'
})
//declare app 
//const app = express()
connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`✅ Server is running at http://localhost:${process.env.PORT || 8000}`);
        console.log(`server is running on port ${process.env.PORT}`);
        
    })})
.catch((err) => {
    console.log("MONGODB db connection failed !!! ", err)
})
/*
import expres from "express";
const app = express()

( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error
        })
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT} `);
        })
        
    } catch (error) {
        console.error("Error:", error)
        throw err
    }
})()
*/
