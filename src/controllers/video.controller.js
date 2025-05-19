import mongoose ,{isValidObjectId} from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudnary } from "../utils/cloudinary.js";

const publishVideo = asyncHandler(async(req,res) => {
    const {title, description,owner, duration} = req.body;

    if (!(title || description)) {
        throw new ApiError(400, "Title and description should not be empty!")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video not be empty")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail not be empty")
    }

    const videoFile = await uploadOnCloudnary(videoFileLocalPath);
    const thumbnailFile = await uploadOnCloudnary(thumbnailLocalPath);
    if (!(videoFile || thumbnailFile)) {
        throw new ApiError(400, "Cloudinary error: missing videoFile?thumbnailFile")
    }

    const videoDoc = await Video.create({
        videoFile:videoFile.url,
        thumbnail:thumbnailFile.url,
        title,
        description,
        owner: req.user?._id,
        isPublished:req.body.isPublished,
        duration,
    })
    // check 
    console.log(`Title :${title}, Owner:${owner}, duration:${duration}`);

    if (!videoDoc) {
        throw new ApiError(500, "Something went wrong while uploading a Video" )
    }

    return res
    .status(200)
    .json(new ApiResponse(201, videoDoc, "Video Published Successfully"))
});


const getAllVideo = asyncHandler(async(req, res) => {
    const {page =1, limit =10, query = "", sortBy = "createdAt", sortType = "desc", userId} = req.query
    
    if (!req.user) {
        throw new ApiError(400, "User not logged In")
    }
    const match = {
        ...(query ? {title:{ $regex:query, $options: "i"}}   : {}),
        ...(userId ? {owner:mongoose.Types.ObjectId(userId)} : {})
    }
    const videos = await Video.aggregate([
        {
            $match : match,
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"videosByOwner"
            },
        },
        {
            $project:{
                videoFile:1,
                thumbnail:1,
                title:1,
                descriptions:1,
                durations:1,
                views:1,
                isPublished:1,
                owner:{
                    $arrayElemAt:["$videosByowner",0]
                },
            },
        },
        {
            $sort:{
                [sortBy]: sortType === "desc" ? -1 : 1,
            }
        },
        {
            $skip: (page - 1) * parseInt(limit),
        },
        {
            $limit:parseInt(limit)
        }
    ]);

    if (!videos?.length) {
        throw new ApiError(404, "Videos are found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
})


const getVideoById = asyncHandler(async(req, res) => {
    const {videoId} = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid userId")
    }

    const video = await Video.findById(videoId).populate("owner", "name email");
    if (!video) {
        throw new ApiError(404, "Video Not Found" )
    }
    return res
    .status(200)
    .json(new ApiResponse(200, video, "Video available"))
});

const updateVideo = asyncHandler(async(req,res) => {
    const {videoId} = req.params;
    const {title, description} = req.body;

    if (!isValidObjectId) {
        throw new ApiError(400, "Invalid VideoId")
    }


    let updateData = {title, description};
    if (req.file) {
        const thumbnailLocalPath = path.req.file;
    
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is missing");
    }

    const thumbnail = await uploadOnCloudnary(thumbnailLocalPath)

    if (!thumbnail.url) {
        throw new ApiError(400, "Error while uploading thumbnail")
    }
    updateData.thumbnail = thumbnail.url;
}
const updateVideo = await Video.findByIdAndUpdate(videoId,
    {$set:updateData},
    {new:true, runValidators:true}
);
if (!updateVideo) {
    throw new ApiError(400, "Video not found")
}
return res
.status(200)
.json(new ApiResponse(200, updateVideo, "Video updated successfully"))
})

const deleteVideo = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    if (!isValidObjectId) {
        throw new ApiError(400, "Invalid VideoId")
    }

    const videodelete = await Video.findByIdAndUpdate(videoId);
    if (!videodelete) {
        throw new ApiError(400, "Video not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, videodelete, "Suceessfully Deleted!"))

})


const togglePublishStatus = asyncHandler(async(req, res) => {
    const {videoId} = req.params;
    if (!isValidObjectId) {
        throw new ApiError(400, "Inavlid videoId")
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404,"Video Not found")
    }
video.isPublished = !video.isPublished
await video.save();

return res
.status(200)
.json(new ApiResponse(200, video, "video suffled successful"))


})

export {
publishVideo,
getAllVideo,
getVideoById,
updateVideo,
deleteVideo,
togglePublishStatus
}
