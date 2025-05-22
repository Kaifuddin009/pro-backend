import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleCommentLike, toggleLikedVideos, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";
const router = Router()

router.route("/video/:videoId").post(verifyJWT,toggleVideoLike)
router.route("/comment/:commentId").post(verifyJWT,toggleCommentLike)
router.route("/tweet/:tweetId").post(verifyJWT,toggleTweetLike)
router.route("/liked/:videoId").get(verifyJWT,toggleLikedVideos)

export default router;