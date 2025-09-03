import {Router} from "express";
import { loginUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

console.log("user router loaded");

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);
// similarly define other routes below like login, etc.

router.route("/login").post(loginUser)

// secured routes

router.route("/logout").post(verifyJWT ,logoutUSer)

export default router