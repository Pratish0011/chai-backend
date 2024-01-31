import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const allComment = await Comment.aggregate([
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: parseInt(limit, 10),
      },
    ]);
    return res
      .status(200)
      .json(new ApiResponse(200, { allComments }, "Success"));
  } catch (error) {}
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { userId } = req.user._id;
  const { content } = req.body;

  try {
    if (!videoId) {
      throw new ApiError(404, "Video not found");
    }

    if (!content || content.trim() === "") {
      throw new ApiError(401, "Please write something");
    }

    const createComment = await Comment.create({
      content: content,
      video: videoId,
      owner: userId,
    });

    res
      .status(200)
      .json(new ApiResponse(200, createComment, "Comment added successfully"));
  } catch (error) {
    throw new ApiError(new ApiError(500, "Internal Server Error"));
  }
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const userId = req.user._id;
  const { content } = req.body;

  try {
    if (!content || content.trim() === "") {
      throw new ApiError(401, "Please write something");
    }

    const comment = await Comment.findOne({
      _id: commentId,
      owner: userId,
    });

    if (!comment) {
      throw new ApiError(404, "Comment not found");
    } else {
      const updateComment = await Comment.updateOne(
        {
          _id: commentId,
          owner: userId,
        },
        {
          $set: {
            content: content,
          },
        },
        {
          new: true,
        }
      );

      return res
        .status(200)
        .json(
          new ApiResponse(200, updateComment, "Comment Updated Successfully")
        );
    }
  } catch (error) {
    throw new ApiError(new ApiError(500, "Internal Server Error"));
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  const userId = req.user._id;

  try {
    const comment = await Comment.findOne({
      _id: commentId,
      owner: userId,
    });

    if (!comment) {
      throw new ApiError(404, "Comment not found");
    } else {
      const deletedComment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: userId,
      });

      return res
        .status(200)
        .json(
          new ApiResponse(200, deletedComment, "Comment deleted Successfully")
        );
    }
  } catch (error) {
    throw new ApiError(new ApiError(500, "Internal Server Error"));
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };
