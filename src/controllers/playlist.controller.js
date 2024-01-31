import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    const userId = req.user._id

    //TODO: create playlist
    try {
        if(!name || name.trim() === ""){
            throw new ApiError(404, "Name is required")
        }

        if(!description || description.trim() === ""){
            throw new ApiError(404, "Description is required")
        }

        const playlist = await Playlist.create(
           { 
            name,
            description,
            owner: userId
            
            }
        )

        res.status(200).json(
            new ApiResponse(200, playlist, "Playlist create successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    try {

        if(!isValidObjectId(userId)){
           throw new ApiError(404, "Invalid User Id")
        }

        const playlists = await Playlist.aggregate([
            {
                $match:{
                    owner: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup:{
                    from: "videos",
                    localField: "videos",
                    foreignField: "_id",
                    as: "videos"
               }
            },
            {
                $addFields:{
                    totalViews:{
                        $sum: "$videos.views"
                    },
                    totalVideos:{
                        $size: "$videos"
                    }
                }
            },
            {
                $project:{
                    _id:1,
                    name:1,
                    description: 1,
                    totalVideos: 1,
                    totalViews : 1,
                    createdAt: 1,
                    updatedAt: 1,
                }
            }
        ])

        if (!playlists) {
            throw new ApiError(500, "Failed to fetch the user playlists");
         }
      
         return res
            .status(200)
            .json(
               new ApiResponse(201, playlists, "User playlist fetched Successfully")
            );
        
    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    try {

        if(!isValidObjectId(playlistId)) {
            throw new ApiError(500, "Invalid playlist ID")
        }

        const playlist = await Playlist.aggregate(
           [
            {
                $match:{
                    _id: new mongoose.Types.ObjectId(playlistId)
                }
            },
            {
                $lookup:{
                    from: "videos",
                    foreignField: "_id",
                    localField: "videos",
                    as: "videos"
                }
            },
            {
                $match:{
                    "videos.isPublished": true
                }
            },
            {
                $lookup:{
                    from: "users",
                    foreignField: "_id",
                    localField: "owner",
                    as: "owner"
                }
            },
            {
                $addFields:{
                    totalViews:{
                        $sum: "$videos.viwes"
                    },
                    owner:{
                        $first: "$owner"
                    },
                    totalVideos:{
                        $size: "$videos"
                    }
                    
                }
            },
            {
                $project: {
                   name: 1,
                   description: 1,
                   createdAt: 1,
                   updatedAt: 1,
                   totalVideos: 1,
                   totalViews: 1,
                   owner: {
                      username: 1,
                      fullName: 1,
                      "avatar.url": 1,
                   },
                   videos: {
                      _id: 1,
                      createdAt: 1,
                      description: 1,
                      views: 1,
                      title: 1,
                      "videoFile.url": 1,
                      "thumbnail.url": 1,
                      duration: 1,
                   },
                },
             },
           ]
        )

        if(!playlist){
            throw new ApiError(404, "Playlist not found")
        }

        res.status(200).json(
            new ApiResponse(200, playlist, "Fetched playlist successfully")
        )
        
    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const userId = req.user._id

    try {

        const playlist = await Playlist.findOne(
            {
                _id: playlistId
            }
        )

        if(!playlist){
            throw new ApiError(404, "Playlist not found")
        }

        if(
            (playlist.owner.toString() && video?.owner?.toString())!== userId.toString()){

          throw new ApiError(401, "Only owner can add video to the playlist")
        }

        const video = await Video.findOne(
            {
                _id: videoId
            }
        )


        if(!video){
            throw new ApiError(404, "Video not found")
        }

        const addVideo = await Playlist.findOneAndUpdate(
            {
                _id: playlistId,
                owner: userId
            },
            {
               $addToSet:{
                videos: videoId
               }
            },
            {
                new: true
            }
        )

        res.status(200).json(
            new ApiResponse(200, addVideo, "Video added to the playlist")
        )


        
    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    try {

        if(!isValidObjectId(playlistId)){
            throw new ApiError(401, "Invalid playlist ID")
        }

        const playlist = await Playlist.findById(playlistId)

        if(!isValidObjectId(videoId)){
            throw new ApiError(401, "Invalid video ID")
        }
        
        const video = await Video.findById(videoId)
        
        if(
            (playlist.owner.toString() && video.owner.toString()) !== req.user._id.toString()
        ){
            throw new ApiError(400, "Only owner can remove the video from the playlist")
        }

        const removeVideoAndUpdate = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $pull:{
                    videos: videoId
                }
            },
            {
                new: true
            }
        )

        if(!removeVideoAndUpdate){
            throw new ApiError(400, "Failed to remove video from playlist")
        }

        res.status(200).json(
            new ApiResponse(201, removeVideoAndUpdate, "Successfully removed the video from the playlist")
        )
    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    try {
        if(!isValidObjectId(playlistId)){
            throw new ApiError(401, "Invalid playlist ID")
        }

        const playlist = await Playlist.findById(playlistId)

        if(playlist.owner.toString() !== req.user._id.toString()){
            throw new ApiError(401, "Only owner can delete the playlist")
        }

        if(!playlist){
            throw new ApiError(404, "Playlist not found")
        }

        const deletedPlaylist = await Playlist.findByIdAndDelete(
            playlistId
        )

        res.status(200).json(
            new ApiResponse(200, {}, "Playlist deleted successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    try {
        if(!isValidObjectId(playlistId)){
            throw new ApiError(401, "Invalid playlist ID")
        }

        const playlist = await Playlist.findById(playlistId)

        if(playlist.owner.toString() !== req.user._id.toString()){
            throw new ApiError(401, "Only owner can delete the playlist")
        }

        if(!playlist){
            throw new ApiError(404, "Playlist not found")
        }

        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set:{
                    name,
                    description,
                }
            
            },
            {
                new: true
            }
        )

        if(!updatedPlaylist){
            throw new ApiError(401, "Failed to update playlist")
        }

        return res.status(200).json(
            new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
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
