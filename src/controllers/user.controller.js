import {asyncHandler} from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/fileupload.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshtoken = async (userId) =>{
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // save this generated refresh token in database so that whenver the accesstoken expires, 
        // the refresh token again get generated : 
        // frontend will send the request using refresh token, to server
        // server will validate the refresh token corresponding to the user, and then passon a new accestoken to user.
        // Refresh tokens are generally long-lived and access tokens are generally short-lived

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return {accessToken, refreshToken};

    }catch(error){
        throw new apiError(500, "Internal Server Error");
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
    // console.log("email", email);

    if(fullName === ""){
        throw new apiError(400, "fullName is required");
    }
    else if(email === ""){
        apiError(400, "email is required");
    }
    else if(password === ""){
        apiError(400, "password is required");
    }
    else if(username === ""){
        apiError(400, "username is required");
    }

    // or summing all the conditions together,
    // we can write using some function of javascript

    // if(
    //     [fullName, username, email, password].some((field) => field?.trim() === "")
    // ){
    //     throw new apiError(400, "All the fileds are required.")
    // }

    const alreadyExistedUser = await User.findOne({
        $or: [{email}, {username}]
    })

    if(alreadyExistedUser){
        throw new apiError(409, "User with email or username already exits.")
    }

    console.log("request received", req.files);
    
    const avatarLocalPath = req.files?.avatar?.[0]?.path 
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path 
    // console.log(req.files);

    if(!avatarLocalPath) {
        throw new apiError(400, "Avatar file is required.")
    }

    // console.log("avatarLocalPath", avatarLocalPath)
    
    const avatar = await uploadOnCloudinary(avatarLocalPath);
// console.log(avatar, "line85");
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    
    // console.log(coverImage, "line 86")

    if(!avatar){
        throw new apiError(400, "Avatar is required");
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
        throw new apiError(500, "Somwthing Went Wrong while regiteration of user.")
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
    if(!(username || email)){
        throw new apiError(400, 'username or email is required');
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new apiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    
    if(!isPasswordValid){
        throw new apiError(404, "Invalid Credentials. Please Try Again!");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshtoken(user._id);
    generateAccessAndRefreshtoken(user._id);

    const loggedinUser = await User.findById(user._id).
    select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new apiResponse(
            200,
            {
                user: loggedinUser, accessToken, refreshToken
            },
            "User Logged In Successfully"
        )
    )
} )

const logoutUser = asyncHandler( async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User Logged Out Successfully"))
})

const refreshAccessToken = asyncHandler( async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new apiError(401, "Unauthorized Request");
    }

    try {
        const decodedIncomingToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedIncomingToken?._id);
        
        if(!user){
                throw new apiError(400, "Invalid Refresh Token");
        }
    
        //check incoming refereshtoken and user's refresh token from db
        if(incomingRefreshToken !== user?.refreshToken){
            throw new apiError(401, "Refresh Token is Expired.")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const{newAccessToken, newRefreshToken} = await generateAccessAndRefreshtoken(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options )
        .json(
            new apiResponse(
                {
                    accessToken, 
                    refreshAccessToken: newRefreshToken
                }
            )
        )
    } catch (error) {
        throw new apiError(401, error?.message || "Invalid Refresh Token")
    }
})


const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new apiError(400, "Invalid Password")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false})

    return res.status(200)
    .json(new apiError(200, {},"Password changed successfully"))
})


const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const{fullName, email} = req.body;

    if(!fullName || !email){
        throw new apiError(400, "All fileds are required")
    }

    User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email,

            }
        }, 
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new apiError(200, user, "Account details updated successfully"))
})


const updateUserAvatar = asyncHandler(async (req, res)=>
{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        throw new apiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalpath);

    if(!avatar.url){
        throw new apiError(400, "Error while uploading an avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password");

    return res
    .status(200)
    .json(
        new apiResponse(200, "Avatar updated successfully")
    )
})


const updateCoverImage = asyncHandler(async (req, res)=>
{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new apiError(400, "Cover image is missing")
    }

    const coverImage = await uploadOnCloudinary(avatarLocalpath);

    if(!coverImage.url){
        throw new apiError(400, "Error while uploading coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password");

    return res
    .status(200)
    .json(
        new apiResponse(200, "Cover image updated successfully")
    )
})


const getUserChannelInfo = asynHandler(async (req, res) => {
    const {username} = req.params;

    if(!username){
        throw new apiError(400, "Username is missing");
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "author_id",
                foreginField: "_id",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount:{
                    $size: "$subscribers"
                },
                subscribedChannelsCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req?.user_id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username:1,
                subscribersCount:1,
                subscribedChannelsCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])

    console.log(channel, "channel object after aggregation");

    if(!channel?.length){
        throw new apiError(400, "channel does not exists")
    }

    return res.status(200)
    .json(
        new apiResponse(200, channel[0], "user channel fetched successfully")
    )
})


const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        }
    ])
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails,
    updateUserAvatar,
    updateCoverImage,
    getWatchHistory
};