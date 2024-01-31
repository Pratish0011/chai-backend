import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    try {
        let baseQuery = {}

        if(query){
            baseQuery.$or = [
                {
                    title: {
                        $regex: query,
                        $options: "i"
                    },
                    description: {
                        $regex: query,
                        $options: "i"
                    },
                }
            ]
        }

        if(userId){
            if(!mongoose.isValidObjectId(userId)){
                throw new ApiError(400, "Invalid userID")
            }

            baseQuery.owner = mongoose.Types.ObjectId(userId)
        }

        const sort = {}
        if(sortBy){
            sort[sortBy] = sortType === "desc" ? -1 : 1
        }

        const result = await Video.aggregatePaginate([
            {
                $match: baseQuery
            },
            {
                $sort: sort
            },
            {
                $project:{
                    videoFile: 1,
                    thumbnail: 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    views: 1,
                    isPublished: 1,
                    owner: 1,
                    createdAt: 1,
                    updatedAt: 1,
                }
            }
        ],{page, limit})

        return res.status(200).json(
            new ApiResponse(200, result, "Video fetched Successfully")
        )
    } catch (error) {
        throw new ApiError(
            500, "Internal Server Error"
        )
    }
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    try {

        if([title, description].some(field => field?.trim() === "")){
            throw new ApiError(401, "All Fields are required")
        }

        const localVideoPath = await req.files?.videoFile[0].path

        if(!localVideoPath){
            throw new ApiError(404, "Video file is required")
        }

        const localThumbnailPath = await req.files?.thumbnail[0].path
 
        if(!localThumbnailPath){
            throw new ApiError(404, "Thumbnail file is required")
        }

        const videoFile = await uploadOnCloudinary(localVideoPath)

        if(!videoFile){
            throw new ApiError(404, "Failed to upload video")
        }

        const thumbnailFile = await uploadOnCloudinary(localThumbnailPath)

        if(!thumbnailFile){
            throw new ApiError(404, "Failed to upload thumbnail")
        }

        const createVideo = await Video.create({
            title,
            description,
            duration: videoFile.duration,

            videoFile : {
                url: videoFile.url,
                public_id: videoFile.public_id
            },

            thumbnail : {
                url: videoFile.url,
                public_id: videoFile.public_id
            },

            isPublished: true,
            owner: req.user._id
        })

        if (!createVideo) {
            throw new ApiError(500, "Video uploading is failed! Try again... ");
         }
      
         return res
            .status(200)
            .json(new ApiResponse(201, createVideo, "Video Uploaded SuccessFully"));


        
    } catch (error) {
        throw new ApiError(
            500, "Internal Server Error"
        )
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    try {
        if(!isValidObjectId(videoId)){
            throw new ApiError(400, "Invalid Video Id")
        }

        const video = await Video.aggregate([
            {
                $match:{
                    _id: mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup:{
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "Likes"
                }
            },
            {
                $lookup:{
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "Owner",
                    pipeline: [
                        {
                            $lookup:{
                                from: "subscriptions",
                                localField: "_id",
                                foreignField: "channel",
                                as: "Subscribers"
                            }
                        },
                        {
                            $addFields:{
                                subscriberCount: {
                                    $size: "$Subscribers"
                                },
                                isSubscribed:{
                                    $cond:{
                                        $if:{
                                            $in: [req.user._id, "$Subscribers.subscriber"]
                                        },
                                        then: true,
                                        else: false
                                    }
                                }
                            }
                        },
                        {
                           $project:{
                            username: 1,
                            "avatar.url": 1,
                            subscriberCount: 1,
                            isSubscribed: 1

                           } 
                        }
                    ]   
                }
            },
            {
               $addFields: {
                    likesCount:{
                        $size: "$Likes"
                    },
                    owner:{
                        $first: "$Owner"
                    },
                    isLiked:{
                        $cond:{
                            $if:{
                                $in: [req.user._id, "$Likes.likedBy"]
                            },
                            then: true,
                            else: false
                        }
                    }
               } 
            },
            {
                $project:{
                    "videoFile.url": 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    createdAt: 1,
                    duration: 1,
                    comments: 1,
                    likesCount: 1,
                    isLiked: 1,

                }
            }
        ])

        if (!video) {
            throw new ApiErrors(500, "Failed To Fetch Video");
         }

         // increment the views by 1

         await Video.findByIdAndUpdate(
            {
                _id: videoId
            },
            {
                $inc: {
                views: 1
                 }
            },{
                new: true
            }
         )

         await User.findByIdAndUpdate(
            {
                _id: req.user._id
            },
            // {   // This doesn't check the duplicate array
            //     $push:{
            //         watchHistory: videoId
            //     }
            // },
           {
             $addToSet: {
                watchHistory: videoId,
             },
            }
         )

         return res
         .status(200)
         .json(new ApiResponse(201, video[0], "Video Fetched Successfully"));
        
    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const {title, description} = req.body

    try {

        if(!isValidObjectId(videoId)){
            throw new ApiError(400, "Invalid Video ID")
        }

        if(!(title && description)){
            throw new ApiError(400, "Title and Description are required")
        }


        const video = await Video.findById(videoId)

        if(!video){
            throw new ApiError(400, "Video not found")
        }

        if(video.owner.toString() !== req.user._id.toString()){
           throw new ApiError(400, "Only video owner can update the video")
        }

        const thumbnailToDelete =  video.thumbnail.public_id
        const thumbnailToUpdate =  req.file?.path

        if(!thumbnailToUpdate){
            throw new ApiError(400, "Thumbnail is required")
        }

        const thumbnail = await uploadOnCloudinary(thumbnailToUpdate)

        if(!thumbnail){
            throw new ApiError(400, "Failed to upload thumbnail")
        }

        const updateVideo = await Video.findByIdAndUpdate(
            {
                _id: videoId
            },
            {
                $set:{
                    title,
                    description,
                    thumbnail:{
                        public_id: thumbnail.public_id,
                        url: thumbnail.url
                    }
                }
            },
            {
                new: true
            }
        )

        if (!updateVideo) {
            throw new ApiError(500, "Failed to update the video");
         }

         await deleteFromCloudinary(thumbnailToDelete)

         return res.status(200).json(
            new ApiResponse(201, updateVideo, "Video Updated Successfully")
         )
        
    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    try {
        if(!isValidObjectId(videoId)){
            throw new ApiError(401, "Invalid video")
        }

        const video = await Video.findById(videoId)

        if (!video){
            throw new ApiError(401, "Video not found")
        }

        if(video.owner.toString() !== req.user._id.toString()){
            throw new ApiError(400, "Only video owner can delete the video ")
        }

        const videoDeleted = await Video.findByIdAndDelete(videoId || video._id)

        if(!videoDeleted){
            throw new ApiError(401, "Failed to delete the video")
        }

        await deleteFromCloudinary(video.thumbnail.public_id)
        await deleteFromCloudinary(video.videoFile.public_id, "video")

        return res.status(200).json(
            new ApiResponse(200, {}, "Video Deleted Successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    try {
        if(!isValidObjectId(videoId)){
            throw new ApiError(401, "Invalid video")
        }

        const video = await Video.findById(videoId)

        if (!video){
            throw new ApiError(401, "Video not found")
        }

        if(video.owner.toString() !== req.user._id.toString()){
            throw new ApiError(400, "Only video owner can delete the video ")
        }

        const togglePublish = await Video.findByIdAndUpdate(
            videoId,
            {
                $set:{
                    isPublished: !video?.isPublished
                }
            },
            {
                new: true
            }
        )

        if (!togglePublish) {
            throw new ApiError(500, "Failed to Toggle publish Video");
         }
      
         return res
            .status(200)
            .json(
               new ApiResponse(
                  201,
                  { isPublished: togglePublish.isPublished },
                  "Video Toggle Publish Successfully"
               )
            );
    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
