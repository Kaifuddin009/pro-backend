import mongoose,{isValidObjectId} from "mongoose";
import {Tweet} from "../models/tweet.model.js"
import { User } from "../models/user.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async(req,res) => {
    const {content} = req.body;
    const ownerId = req.user._id;
    
    if (!content) {
        throw new ApiError(400, "Content should not be an empty")
    }
    const newTweet = await Tweet.create({content, owner:ownerId})
    if (!newTweet) {
        throw new ApiError(400, "Something went wrong!!!")
    }
    return res.status(201).json(new ApiResponse(201, newTweet,"Tweet create successsfuly"));
})

const getUserTweets = asyncHandler(async(req, res) => {
const {ownerId} = req.params;
if (!isValidObjectId(ownerId)) {
    throw new ApiError(400, "Invalid user ID")
}

const tweets = await Tweet.find({owner:ownerId}).sort({createdAt:-1});
if (!tweets) {
    throw new ApiError(400, "Tweet are not fetched")
}
return res
.status(200)
.json(new ApiResponse(200, tweets, "tweets created successfully"))
})

const updateTweet = asyncHandler(async(req, res) => {
    const {tweetId} = req.params
    const {content} = req.body
    const ownerId = req.user._id

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID")
    }
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(400, "Tweet Not found")
    }
    if (tweet.owner.toString() !== ownerId.toString()) {
        throw new ApiError(400, "You can only update your own tweet")
    }

    const updateTweet = await Tweet.findByIdAndUpdate(
        tweetId,{
            $set:{
                content,
            },
        },
        {new:true}
    );
    if (!updateTweet) {
        throw new ApiError(500, "Something went wrong while updating a tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updateTweet,"Tweet updated successfully"))

})

const deleteTweet = asyncHandler(async(req, res) => {
const {tweetId} = req.params
const ownerId = req.user._id

if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid TweetID")
}
const tweet = await Tweet.findById(tweetId);
if (!tweet) {
    throw new ApiError(404, "Tweet not found")
}
if (tweet.owner.toString() !== ownerId.toString()) {
    throw new ApiError(400, "You can delete your own tweet only")
}
const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
if (!deletedTweet) {
    throw new ApiError(500, "Something went wrong while deleting a tweet")
}
return res.status(200)
.json(new ApiResponse(200, deletedTweet, "Tweet deleted"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
