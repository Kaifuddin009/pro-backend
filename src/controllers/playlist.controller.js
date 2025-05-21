import mongoose,{isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";

const createPlaylist = asyncHandler(async(req, res) => {
    const {name, description} = req.body;
    if (!(name && description)) {
        throw new ApiError(400, "name and description must be required")
    }

    const playlist = await Playlist.create({
        name, 
        description,
        owner : req.user._id
    })
    if (!playlist) {
        throw new ApiError(500, "Something went wrong while creating a playlist")
    }

    return res
    .status(201)
    .json(new ApiResponse(201, playlist, "playlist created"))

})

const getUserPlaylists = asyncHandler(async(req,res) => {
    const {userId} = req.params;
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
        
    }
    const playlists = await Playlist.find({owner : userId});
    if (!playlists) {
        throw new ApiError(400, "Not exists Plylists with this userId")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Fetched successfully"))
})

const getPlaylistById = asyncHandler(async(req, res) => {
    const {playlistId} = req.params;
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId")
    }
    const playlist = await Playlist.findById(playlistId).populate("videos");
    if (!playlist) {
        throw new ApiError(404, "playlist not fetched")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Found Successfully"))
})

const addVideoToPlaylist = asyncHandler(async(req, res) => {
    const {playlistId, videoId} = req.params;
    if (!(isValidObjectId(playlistId) && isValidObjectId(videoId))) {
        throw new ApiError(400, "Not exits with Ids")
    }
    const updatePlaylist = await Playlist.aggregate([
        {
            $match:{
                _id: playlistId
            },
        },
        {
            $addFields:{
                videos:{
                    $setUnion:["$videos", [new mongoose.Types.ObjectId(videoId)]]
                },
            },
        },
        {
            $merge:{
                into:"playlists",
            },
        },
    ]);
    if (!updatePlaylist) {
        throw new ApiError(404, "Not found anything")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, updatePlaylist, "Successfu!!y added video in playlist"))
})

const removeVideoFromPlaylist = asyncHandler(async(req, res) => {
    const {videoId,playlistId} = req.params;
    if (!(isValidObjectId(videoId) && isValidObjectId(playlistId))) {
        throw new ApiError(400, "Ids not exists")
    }
    const updatePlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{
                videos:new mongoose.Types.ObjectId(videoId)
            },
        },{new:true}
    );
    if (!updatePlaylist) {
        throw new ApiError(404, "Playlist Not Found")
    }
    return res 
    .status(200)
    .json(new ApiResponse(200, updatePlaylist, "successfully removed video from playlist" ))
})

const deletePlaylist = asyncHandler(async(req, res) => {
    const {playlistId} = req.params;
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "playlist not exists with this Id")
        }
        const playlistdelete = await Playlist.findByIdAndDelete(playlistId);
        if (!playlistdelete) {
            throw new ApiError(404, "Something went wrong while deleting a playlist")
        }
        return res
        .status(200)
        .json(new ApiResponse(200, playlistdelete, "sucessfully playlist deleted"))
})

const updatePlaylist = asyncHandler(async(req, res) => {
    const {playlistId} = req.params;
    const {name, description} = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Inalid Id")
    }
    if (!(name && description)) {
        throw new ApiError(400, "name & description not be empty")
    }
    const playlistUpdate = await Playlist.findByIdAndUpdate(playlistId,
        {
            $set:{
                name,description
            }
        },{new:true}
    );
    if (!updatePlaylist) {
        throw new ApiError(404, "playlist not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, playlistUpdate,"sucessfully update"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}