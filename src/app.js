import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({limit: "16kb"})) 
app.use(express.urlencoded({extended:true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//segregated routes import 
import userRouter from "./routes/user.routes.js";



//Routes declaration
//we declare routes using middlewares for clean code in large codebase.

app.use("/api/v1/users", userRouter); //this moddleware pass the control to userRouter and in user router, we define on which route, which controller is to be called.

// https://localhost:7000/users/register this /register is to be defined in userRouter

export default app;