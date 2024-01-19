import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    // Check if the content is empty
    // Check if the user is login
    const {content} = req.body

    if(content.trim() === ""){
        throw new ApiError(
            400,
            "Please wring somthing to tweet"
        )
    }

    const userId = req.user._id

    const createTweet = await Tweet.create({
        content,
        owner: userId
    })

    if(!createTweet){
        throw new ApiError(404, "Error while creating tweet")
    }

    return res
    .status(201)
    .json(
        ApiResponse(201, createTweet, "Tweet created successfully")
    )


})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    // Check if the user is authenticate
    // Check if there is any tweet associated with the user

    const userId = req.user?._id

    if(!userId){
        throw new ApiError(404, "Unauthorized, Please login first")
    }

    try {

        const usersTweet = await Tweet.find({
            owner: userId
        })
        
        if(!usersTweet || usersTweet.content.trim() === ""){
            throw new ApiError(404, "Tweet not found")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, usersTweet, "User tweets fetched Successfully")
        )
    } catch (error) {

        throw new ApiError(404,"Internal Server Error")
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    // Check if the user is valid
    // Check if the content is empty or not

    const {tweetId} = req.params
    const {content} = req.body

    if(!mongoose.Types.ObjectId.isValid(tweetId)){
        throw new ApiError(404, "Invalid Tweet ID")
    }

    if(!content || content.trim() === ""){
        throw new ApiError(400,"Content is empty")
    }

    const updatedTweet = await Tweet.findOneAndUpdate(
        {
            _id: tweetId,
            owner: req.user?._id
        },
        {
            $set:{
                content: content
            }
        },
        {
            new: true
        }
    )

    if (!updatedTweet){
        throw new ApiError(404, "Error while updating tweet")
    }

    return res
    .status(200)
    .json(
        200,
        updateTweet,
        "Tweet updated successfully"
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params

    if(!mongoose.Types.ObjectId.isValid(tweetId) || !tweetId){
        throw new ApiError(400, "Invalid Tweet ID")
    }

    const deleteTweet = await Tweet.findOneAndDelete(
        {
            _id : tweetId,
            owner: req.user?._id
        }
    )

    if(!deleteTweet){
        throw new ApiError(
            404,
            "Error while deleting the tweet"
        )
    }

    return res
    .status(200)
    .json( new ApiResponse(200,deleteTweet, "Tweet deleted Successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
