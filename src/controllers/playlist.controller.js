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
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    try {
        const playlist = await Playlist.findOne(
            {
                _id: playlistId
            }
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
                video:{
                    $push: videoId
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

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
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
