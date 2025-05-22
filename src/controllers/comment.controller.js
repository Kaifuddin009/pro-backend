import mongoose,{isValidObjectId} from "mongoose";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import {Video} from "../models/video.model.js";

const getVideoComment = asyncHandler(async(req, res) => {
    const {videoId} = req.params;
    const {page =1, limit = 10} = req.query;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid VideoId")
    }
    
    const comments = await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            },
        },
        {
            $lookup:{
                from:"users",
                localField:"video",
                foreignField:"_id",
                as:"CommentOnWhichVideo",  
          },
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"OwnerOfComment",
            },
        },
        {
            $project:{
                content:1,
                owner:{
                    $arrayElemAt:["$OwnerOfComment",0]
                },
                video:{
                    $arrayElemAt:["$CommntOnWhichVideo",0]
                },
                createdAt:1,
            },
        },
        {
            $skip:(page - 1)*parseInt(limit),
        },
        {
            $limit:parseInt(limit)
        },
    ]);
    if (!comments?.length) {
        throw new ApiError(404, "Comments not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, comments, "comment fetched successfully"))
})

const addComment = asyncHandler(async(req, res) => {
    const {videoId} = req.params;
    const {content} = req.body;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }
    if (!req.user) {
        throw new ApiError(401, "needs user to be loggedIn")
    }
    if (!content) {
        throw new ApiError(400, "empty or null field are invalid")
    }
    const addComments = await Comment.create({
        content,
        owner:req.user?.id,
        video:videoId
    })
    if (!addComments) {
        throw new ApiError(500, "Somthing went wrong while adding a comment")
    }
    return res
    .status(201)
    .json(new ApiResponse(201, addComments,videoId,"Comment added successfully"))
})
const updateComment = asyncHandler(async(req, res) => {
 const {commentId} = req.params;
 const {content} = req.body;
 if (!isValidObjectId(commentId)) {
    throw new ApiError(404, "Inavalid commentId")
 }
 if (!req.user) {
    throw new ApiError(401, "user must be loggedIn")
 }
 if (!content) {
    throw new ApiError(400, "Not be Empty")
 }
 const commentUpdate = await Comment.findByIdAndUpdate(
    {
        _id:commentId,
        owner:req.user._id,
    },
    {
        $set:{content},
    },{new:true}
 );
 if (!commentUpdate) {
    throw new ApiError(500, "something went wrong while uploading a comment")
 }
 return res
 .status(200)
 .json(new ApiResponse(200, commentUpdate, "successfully updated"))

})
const deleteComment = asyncHandler(async(req, res) => {
    const {commentId} = req.params;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid CommentID")
    }
    if (!req.user) {
        throw new ApiError(404, "User Must be loggedIn")
    }
    const commentDelete = await Comment.findByIdAndDelete({
        _id:commentId,
        owner:req.user._id,
    });
    if (!commentDelete) {
        throw new ApiError(500, "Something went wrong while deleting a comment")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, commentDelete, "successfully deleted"))
})
export{
    getVideoComment,
    addComment,
    updateComment,
    deleteComment
}