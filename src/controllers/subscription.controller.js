import mongoose,{isValidObjectId} from "mongoose";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {Subscription} from "../models/subscription.model.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const getUserChannelSubscriber = asyncHandler(async(req, res) => {

    const channelId = req.params.channelId;
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId")
    }

    const subscriberList = await Subscription.find({
        channel:channelId
    }).populate("subscriber", "_id email name");

    if (!subscriberList) {
        throw new ApiError(404, "subscriber list not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, subscriberList, "Subscriber list fetched successfully" ))


})

const getSubscribedChannel = asyncHandler(async(req, res) => {
    const subscriberId = req.user._id;

    const subscriberChannel = await Subscription.find({
        subscriber:subscriberId
    }).populate("channel", "_id name email");
    if (!subscriberChannel) {
        throw new ApiError(404, "Channel List not Found")
    }
return res
.status(200)
.json(new ApiResponse(200, subscriberChannel,"Fetched Successfull"))


})

const toggleSubscriptions = asyncHandler(async(req, res) => {
    const {channelId} = req.params;
    const subscriberId = req.user._id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel Id")
    }

    if (subscriberId.toString() === channelId.toString()) {
        throw new ApiError(404, "Not subscribed own channel")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber:subscriberId,
        channel:channelId
    })
    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id)
        return res
        .status(200)
        .json(ApiResponse(200, {}, "unssubscribed successfully"  ))
    }

    await Subscription.create({subscriber:subscriberId, channel:channelId})
    return res
    .status(201)
    .json(new ApiResponse(201,{}, "subscribed successfully"))
})

export {
    getUserChannelSubscriber,
    getSubscribedChannel,
    toggleSubscriptions

}