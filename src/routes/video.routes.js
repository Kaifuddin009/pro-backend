import { Router } from "express";
import {  publishVideo,getAllVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/publish").post(upload.fields([
    {
        name:"videoFile",maxCount:1
    },
    {
        name:"thumbnail",maxCount:1
    }
]),verifyJWT,publishVideo)
router.route("/allvideo/:videoId").get(verifyJWT,getAllVideo)
router.route("/:videoId").get(verifyJWT,getVideoById)
router.route("/update/:videoId").patch(verifyJWT,updateVideo)
router.route("/delete/:videoId").delete(verifyJWT,deleteVideo)
router.route("/toggle-status/:videoId").patch(verifyJWT,togglePublishStatus)

export default router