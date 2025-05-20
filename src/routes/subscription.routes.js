import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getSubscribedChannel, getUserChannelSubscriber, toggleSubscriptions } from "../controllers/subscription.controller.js";

const router = Router()

router.route("/userchannelsubscriber/:channelId").get(verifyJWT,getUserChannelSubscriber);
router.route("/channel-subscribed").get(verifyJWT,getSubscribedChannel);
router.route("/toggle-subscription/:channelId").patch(verifyJWT,toggleSubscriptions);
 export default router;