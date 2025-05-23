import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) throw new ApiError(401, "Video Id is required!");

  const commentsOnVideo = await Comment.aggregate([
    {
      $match: { video: mongoose.Types.ObjectId(videoId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const comments = await Comment.aggregatePaginate(commentsOnVideo, options);

  if (!comments)
    throw new ApiError(500, "Something went wrong while finding comments");

  res
    .status(200)
    .json(new ApiResponse(200, comments, "Comment fetch successfully."));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  const ownerId = req.user._id;
  if (!content || !videoId || !ownerId)
    throw new ApiError(401, "All Fields are required!");

  const newComment = await Comment.create({
    content,
    video: videoId,
    owner: ownerId,
  });

  if (!newComment)
    throw new ApiError(500, "Something went wrong while adding Comment.");

  res
    .status(201)
    .json(new ApiResponse(201, newComment, "Comment Added Successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { id } = req.params;
  const { content } = req.body;

  if (!id || !content)
    throw new ApiError(401, "Comment and it's id is required");

  const updatedComment = await Comment.findByIdAndUpdate(
    id,
    {
      content: content,
    },
    { new: true }
  );

  if (!updatedComment)
    throw new ApiError(500, "Something went wrong while updating comment.");

  res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment Updated Successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { id } = req.params;

  if (!id) throw new ApiError(401, "Comment Id is required.");

  const deletedComment = await Comment.findByIdAndDelete(id);

  if (!deletedComment) throw new ApiError(404, "Comment not found.");

  res
    .status(204)
    .json(new ApiResponse(204, deletedComment, "Comment Deleted Successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
