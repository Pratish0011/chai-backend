import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const userId = req.user._id

    try {

        const likedVideo = await Like.findOne({
            video: videoId,
            likedBy: userId
        })

        if(!likedVideo){
            const likeVideo = await Like.create({
                video: videoId,
                likedBy: userId
            })

            return res.status(200).json(
                ApiResponse(200, likeVideo, "Liked the video")
            )
        }else{
            await Like.findOneAndDelete({
                video: videoId,
                likedBy: userId
            })

            return res.status(200).json(
                ApiResponse(200,{},"Unliked the video")
            )
        }
        
    } catch (error) {
        throw new ApiError(404, "Something went wrong")
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const userId = req.user._id
    
    try {

        const likedComment = await Like.findOne({
            comment: commentId,
            likedBy: userId
        })

        if(!likedComment){
            const likeComment = await Like.create({
                comment: commentId,
                likedBy: userId
            })

            return res.status(200).json(
                new ApiResponse(200, likeComment, "Liked the comment")
            )
        }else{
            await Like.findOneAndDelete({
                comment: commentId,
                likedBy: userId
            })

            return res.status(200).json(
                new ApiResponse(200,{}, "Unliked the comment")
            )
        }
        
    } catch (error) {
        throw new ApiError(404, "Something went wrong")
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const userId = req.user._id
    
    try {

        const likedTweet = await Like.findOne({
            tweet: tweetId,
            likedBy: userId
        })

        if(!likedTweet){
            const likeTweet = await Like.create({
                tweet: tweetId,
                likedBy: userId
            })

            return res.status(200).json(
                new ApiResponse(200, likeTweet, "Liked the tweet")
            )
        }else{
            await Like.findOneAndDelete({
                tweet: tweetId,
                likedBy: userId
            })

            return res.status(200).json(
                new ApiResponse(200,{}, "Unliked the tweet")
            )
        }
        
    } catch (error) {
        throw new ApiError(404, "Something went wrong")
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id
    try {

        const allLikedVideos = await Like.find({
            likedBy: userId,
            video: {$exists: true}
        })

        res.status(200).json(
            new ApiResponse(200, allLikedVideos, "Fetched all liked videos")
        )
        
    } catch (error) {
        throw new ApiError(404, "Something went wrong")
    }
})


// const getLikedVideos = asyncHandler(async (req, res) => {
//     //TODO: get all liked videos
//     const userId = req.user._id
//     try {

//         const allLikedVideos = await Like.aggregate(
//             {
//                $match: {
//                 likedBy: userId,
//                 video: {$exists: true}
//                }
//            },
//            {
//             $lookup:{
//                 from: 'videos',
//                 localField: 'video',
//                 foreignField: '_id',
//                 as: 'videoDetails', 
//             },
//            },
//            {
//             $unwind:"$videoDetails"
//            },
//            {
//             $project:{
//                 _id: 1,
//                 likedBy: 1,
//                 createdAt:1,
//                 updatedAt:1,
//                 video: "$videoDetails"
//             }
//            }
        
        
//         )

//         res.status(200).json(
//             new ApiResponse(200, allLikedVideos, "Fetched all liked videos")
//         )
        
//     } catch (error) {
//         throw new ApiError(404, "Something went wrong")
//     }
// })

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}