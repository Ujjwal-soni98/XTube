import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/fileupload.js";
import { apiResponse } from "../utils/apiResponse.js";

const generateAccessAndRefreshtoken = async (userId) =>{
    try{
        const user = await User.findById(userId);
    }catch(error){
        throw new ApiError(500, "Internal Server Error");
    }
}

const registerUser = asyncHandler( async (req,res) => {
    // get user info from frontend form
    // validate them - should not be empty
    // check if user already exists: basis: username, email
    // check for images: avatar, coverImage.
    // upload images to cloudinary.
    // create user object => entry in db
    // remove password and refresh token field from response 
    // check whether user is created or not.
    // return response.

    const {fullName, email, username, password} = req.body;
    console.log("email", email);

    if(fullName === ""){
        throw new ApiError(400, "fullName is required");
    }
    else if(email === ""){
        ApiError(400, "email is required");
    }
    else if(password === ""){
        ApiError(400, "password is required");
    }
    else if(username === ""){
        ApiError(400, "username is required");
    }

    // or summing all the conditions together,
    // we can write using some function of javascript

    // if(
    //     [fullName, username, email, password].some((field) => field?.trim() === "")
    // ){
    //     throw new ApiError(400, "All the fileds are required.")
    // }

    const alreadyExistedUSer = User.findOne({
        $or: [{email}, {username}]
    })

    if(alreadyExistedUSer){
        throw new ApiError(409, "USer with email or username already exits.")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path 
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    console.log(req.files);

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required.")
    }

    
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar is required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500, "Somwthing Went Wrong while regiteration of user.")
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User Registered Successfully.")
    )

})

const loginUser = asyncHandler( async (req, res) => {
    // take email and password from frontend form req body -> data
    // validate them should not be empty (username or email)
    // find user
    // check if credentials matches from exsting user then,
    // generate access token and refresh token 
    // send cookies
    // prompt => loggedin successfully
    const {email, username, password} = req.body;
    if(!username || !email){
        throw new apiError(400, 'username or email is required');
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    
    if(!isPasswordValid){
        throw new ApiError(404, "Invalid Credentials. Please Try Again!");
    }



} )

export {registerUser};