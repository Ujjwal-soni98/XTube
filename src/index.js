//Approach 1 to connect database in index.js file.
/* 

import mongoose from 'mongoose';
import { DB_NAME } from './constants';
import express from "express";
const app = express ();
( async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        //database is connected but may be error may come 
        // while communicating with express. So handle that -

        app.on("error", (error) => {
            console.log("ERR: ", error);
            throw error;
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on port ${process.env.PORT}`)
        });
    } catch(error){
        console.log("error:", error);
        throw error;
    }
})()

*/


// approach 2 is to connect db in index.js in db folder for more 
//modular and easy to read code.

import express from "express";
import app from "./app.js"
import dotenv from "dotenv";
dotenv.config({
    path: './.env'   // experimental feature of dotenv to be configured in package.json dev scripts
})
// console.log(process.env)
const listeningOn = process.env.PORT || 8000;
import connectDB from "./db/index.js";
connectDB()
.then(() => {
    app.on("error", (error) => {
            console.log("ERR: ", error);
            throw error;
        });

    app.listen(listeningOn , () => {
        console.log(`app is listening on Port ${listeningOn}`);
    } );
})
.catch((err) => {
    console.log(err);
})
console.log(process.env.PORT)


