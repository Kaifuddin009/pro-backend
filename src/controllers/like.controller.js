import mongoose,{ isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from '../models/like.model.js';

const toggleVideoLike = asyncHandler(async(req, res) => {
    const {videoId} = req.params;
    const userId = req.user._id;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }
    const existingLike = await Like.findOne({
        video:videoId,
        likedby:userId,
    });
     if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res 
        .status(200)
        .json(new ApiResponse(200, existingLike, "Video Unliked successfully"))
     }
     const LikedVideo = await Like.create({
        video:videoId,
        likedby:userId,
     });
     return res
     .status(201)
     .json(new ApiResponse(201, LikedVideo, "Liked video successfully"))


})
const toggleCommentLike = asyncHandler(async(req, res) => {
    const {commentId} = req.params;
    const userId = req.user._id;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId")
    }
    const existingLike = await Like.findOne({
        commentId,
        userId,
    });
    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res 
        .status(200)
        .json(new ApiResponse(200, existingLike,"Comment unliked successfully"))
    }
    const likeComment = await Like.create({
        commentId,
        userId
    });
    return res
    .status(201)
    .json(new ApiResponse(201, likeComment,"Comment like successfully"))
})

const toggleTweetLike = asyncHandler(async(req, res) => {
    const {tweetId} = req.params;
    const userId = req.user._id;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Inavalid tweetId")
    }
    const existingTweet = await Like.findOne({
        tweetId,
        userId
    });
    if (existingTweet) {
        await Like.findByIdAndDelete(existingTweet._id)
        return res
        .status(200)
        .json(new ApiResponse(200, existingTweet,"Tweet Unliked Successfully"))
    }
    const likeTweet = await Like.create({
        tweetId,
        userId
    })
    return res
    .status(201)
    .json(new ApiResponse(201, likeTweet,"Tweet Like successfully"))
})
    
const toggleLikedVideos = asyncHandler(async(req, res) => {
    
    const userId = req.user._id;
    
    const likedVideos = await Like.find({
        Likedby:userId,
        videos:{$exists:true},
    }).populate("videos", "_id title url");
    return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Liked video fetched successfully"))
})
export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    toggleLikedVideos
}