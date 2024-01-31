import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    try {

        if(!isValidObjectId(channelId)){
            throw new ApiError(401, "Invalid Channel ID")
        }

        const subscriberAlready = await Subscription.findOne(
            {
                channel: channelId,
                subscriber: req.user?._id 
            }
        )

        if(subscriberAlready){
            await Subscription.findByIdAndDelete(subscriberAlready._id)

            return res.status(200).json(
                new ApiResponse(
                    201,
                    {
                        subscribed: false
                    },
                    "Channel Unsubscribed Successfully"
                )
            )
        }

        await Subscription.create({
            subscriber: req.user?._id,
            channel: channelId
        })

        return res.status(200).json(
            new ApiResponse(
                201,
                {subscribed: true},
                "Channel Subscribed Successfully"
            )
        )
        
    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    try {
        if(!isValidObjectId(channelId)){
            throw new ApiError(400, "Invalid Channel ID")
        }

        const subscribers = await Subscription.aggregate([
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup:{
                    from: "users",
                    foreignField: "_id",
                    localField: "subscriber",
                    as: "subscriber"
                }
            },
            {
                $addFields:{
                    subscriberCount: {
                        $sum: "$subscriber"
                    }
                }
            },
            {
                $unwind: "$subscriber"
            },
            {
                $project:{
                    subscriber:{
                        _id:1,
                        username: 1,
                        fullName:1,
                        "avatar?.url":1,     
                    },
                    subscriberCount: 1
                }
            }
        ])

        if(!subscribers){
            throw new ApiErrors(500, "Failed to fetch Subscribers");
        }

        return res
        .status(200)
        .json(
            new ApiResponse(201, subscribers, "Subscribers fetched Successfully")
        )

    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    try {
        if (!isValidObjectId(subscriberId)) {
            throw new ApiError(400, "Invalid Subscriber Id");
         }

         const subscribedChannels = await Subscription.aggregate([
            {
                $match:{
                    subscriber: new mongoose.Types.ObjectId(subscriberId)
                }
            },
            {
                $lookup:{
                    from:"users",
                    foreignField: "_id",
                    localField:"channel",
                    as: "subscribedChannel",
                    pipeline:[
                        {
                            $lookup:{
                                from: "videos",
                                foreignField: "owner",
                                localField: "_id",
                                as:"videos"
                            }
                        },
                        {
                            $addFields:{
                                latestVideo:{
                                    $last: "$videos"
                                }
                            }
                        }
                    ]
                }
            },
            {
                $addFields:{
                    subscribedChannelCount:{
                        $sum: "$subscribedChannel"
                    }
                }
            },
            {
                $unwind:"$subscribedChannel"
            },          
            {
                $project:{
                    subscribedChannelCount:1,
                    subscribedChannel:{
                        _id:1,
                        username:1,
                        fullName: 1,
                        latestVideo: {
                            _id: 1,
                            "videoFile.url": 1,
                            "thumbnail.url": 1,
                            duration: 1,
                            title: 1,
                            createdAt: 1,
                            description: 1,
                            owner: 1,
                         },
                    }
                }
            }
         ])

         if(!subscribedChannels){
            throw new ApiError(500, "Failed to fetch subscribed channels")
         }

         return res
      .status(200)
      .json(
         new ApiResponse(
            201,
            subscribedChannels,
            "Subscribed channels fetched Successfully"
         )
      );

    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}