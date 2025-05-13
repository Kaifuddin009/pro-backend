import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudnary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import fs from 'fs';
import jwt from "jsonwebtoken"
import mongoose from 'mongoose';
const generateAccessAndRefreshTokens = async(userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken =refreshToken
    await user.save({ validateBeforeSave : false})
    
    return {accessToken, refreshToken}
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token")
  }
}

const registerUser = asyncHandler( async (req, res) => {
    /*
    1.get user details from frontend
    2.validation - not empty
    3.check if user already exists: usernsme, email
    4.check for images, check for avatar
    5.upload them to to cloudnary, avatar 
    6.create user object - create entry in db 
    7.remove password and refresh token field from response
    8.check for user creation 
    9.return res
    */ 
    console.log("REQ FILES:", req.files);

    const {fullName, email, username, password } = req.body;
    console.log("email",email);

    if (
        [fullName,username,email, password].some((field) => field?.trim() === "")
    ) {
       throw new ApiError(400, "All fields are required") 
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    console.log("Avatar File:", req.files?.avatar[0]);

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path 
      
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

  const avatar =   await uploadOnCloudnary(avatarLocalPath, false);
  const coverImage =   await uploadOnCloudnary(coverImageLocalPath);
  
   if (fs.existsSync(avatarLocalPath)) {
        fs.unlinkSync(avatarLocalPath);
    }

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required")
  }
    const user  =  await User.create({
    fullName, 
    avatar: avatar.url,
    coverImage:coverImage.url|| "",
    email,
    password,
    username:username.toLowerCase()
  })
  const createdUser = await User.findById(user._id).select("-password -refreshToken"
  )
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered succesfully ")
  )
  
})

const loginUser = asyncHandler(async(req,res) => {

  const {email, username, password} = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or email must be required")
  }
   const user = await User.findOne({
    $or:[{username},{email}]
  })
  if (!user) {
    throw new ApiError(404,"user doesn't exits")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentails")
  }

  const { accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,{
        user: loggedInUser, accessToken,refreshToken
      }, "User logged successfully"
    )
  )

})

const logoutUser = asyncHandler(async(req,res) => {
   User.findByIdAndUpdate(
    req.user._id,{
      $set:{
        refreshToken:undefined
      }
    },
    {
      new:true
    }
   )
   const options = {
    httpOnly: true,
    secure:true
   }
   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200, {}, "User logged out"))
})

const refreshAccessToken = asyncHandler(async (req,res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request")
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    const user = await User.findById(decodedToken?._id)
    if (!user) {
      throw new ApiError(401, "Invalid refresh token")
    } 
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or invalid")
    }
    const options ={
      httpOnly:true,
      secure:true
    }
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
  
    return res.status(200).cookie("accessToken", accessToken,options).cookie("refreshToken", newRefreshToken,options).json(
      new ApiResponse(200, {accessToken, refreshToken:newRefreshToken},"refresh token refreshed"
        
      )
    )
  
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token")
  }


})
 const changeCurrentPassword = asyncHandler(async(req,res) => {
  const {oldPassword, newPassword} = req.body
  const user = await   User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password")
  }
  user.password = newPassword
  await user.save({validateBeforeSave:false})
  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successsfully"))
 })

 const getCurrentUser = asyncHandler(async(req,res) => {
  return res
  .status(200)
  .json(200, req.user, "current user fetched successfully")
 })

 const updateAccountDetails = asyncHandler(async(req, res) => {
  const {fullName, email} = req.body
  if (!fullName || !email) {
    throw new ApiError(400, "All feilds are required")
  }
  const user  = User.findByIdAndUpdate(req.user?._id,{
    $set:{
      fullName,
      email:email
    }
  },
  {new :true}
).select("-password")

return res
.status(200)
.json(new ApiResponse(200, user, "Account Details updated successfully"))
 })

 const updateUserAvatar = asyncHandler(async(req, res)=> {
  const avatarLocalPath = req.file?.path
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is missing")
  }

  const avatar =  await uploadOnCloudnary(avatarLocalPath) 
  if (!avatar.url) {
    throw new ApiError(400, "Error while  uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user, "Avatar image updated successfully")
  )
 })

  const updateUserCoverImage = asyncHandler(async(req, res)=> {
  const coverImageLocalPath = req.file?.path
  if (!coverImageLocalPath) {
    throw new ApiError(400, "coverImage is missing")
  }

  const coverImage =  await uploadOnCloudnary(coverImageLocalPath) 
  if (!coverImage.url) {
    throw new ApiError(400, "Error while  uploading on coverImage")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage:coverImage.url
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user, "coverImage updated successfully")
  )
 })

 const getUserChannelProfile = asyncHandler(async(req,res) => {
  const {username} = req.params
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing")
  }
  const channel = await User.aggregate([
    {
      $match:{
        username:username
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },
    {
      $addFields:{
        subscriberCount:{
          $size: "$subscribers"
        },
        channelSubscribedTo:{
          $size: "$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    },
    {
      fullName:1,
      username:1,
      subscriberCount:1,
      channelSubscribedTo:1,
      isSubscribed:1,
      avatar:1,
      coverImage:1,
      email:1
    }
  ])

  if (!channel?.length) {
    throw new ApiError(400, "channel does not exits")
  }
  return res
  .status(200)
  .json(
    new ApiResponse(200, channel[0], "user channel fetched successfully ")
  )
 })

 const getWatchHistory = asyncHandler(async(req, res) => {
  const user = await User.aggregate([
    {
      $match:{
        _id: req.user._id
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    avatar:1,
                    username:1         
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ])
  return res
  .status(200)
  .json(
    new ApiResponse(200, user[0].watchHistory, "watchHistory fetched Successfull")
  )
 })


export {registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getWatchHistory
}