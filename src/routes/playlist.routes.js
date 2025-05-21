import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";
const router = Router();

router.route("/create-playlist").post(verifyJWT,createPlaylist)
router.route("/user-playlist/:userId").get(verifyJWT,getUserPlaylists)
router.route("/byId/:playlistId").get(verifyJWT,getPlaylistById)
router.route("/videoadd/:playlistId/:videoId").patch(verifyJWT,addVideoToPlaylist)
router.route("/videoremove/:playlistId/:videoId").patch(verifyJWT,removeVideoFromPlaylist)
router.route("/delete/:playlistId").delete(verifyJWT, deletePlaylist)
router.route("/update/:playlistId").patch(verifyJWT, updatePlaylist)
export default router;
