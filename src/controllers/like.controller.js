import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!videoId) throw new ApiError(400, "Video ID is required");

  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid Video ID");
  const userId = req.user._id;
  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: userId,
  });

  if (existingLike) {
    const deletedLike = await Like.findByIdAndDelete(existingLike._id);
    if (!deletedLike) throw new ApiError(500, "Failed to delete like");

    return res
      .status(200)
      .json(new ApiResponse(200, deletedLike, "Like removed"));
  }

  if (!existingLike) {
    const newLike = await Like.create({ video: videoId, likedBy: userId });
    if (!newLike) throw new ApiError(500, "Failed to create like");
    return res.status(201).json(new ApiResponse(201, newLike, "Like added"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!commentId) throw new ApiError(400, "Comment Id is required");

  if (!isValidObjectId(commentId))
    throw new ApiError(400, "Invalid Comment Id");

  const userId = req.user._id;

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });
  if (existingLike) {
    const deletedLike = await Like.findByIdAndDelete(existingLike._id);
    if (!deletedLike) throw new ApiError(500, "Failed to delete Like");
    return res
      .status(200)
      .json(new ApiResponse(200, deletedLike, "Like Removed"));
  }

  if (!existingLike) {
    const newLike = await Like.create({ comment: commentId, likedBy: userId });
    if (!newLike) throw new ApiError(500, "Failed to create Like");
    return res.status(201).json(new ApiResponse(201, newLike, "Like Added"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!tweetId) throw new ApiError(400, "Tweet Id is required");
  if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid Tweet Id");
  const userId = req.user._id;
  const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });

  if (existingLike) {
    const deletedLike = await Like.findByIdAndDelete(existingLike._id);
    if (!deletedLike) throw new ApiError(500, "failed to delete like");
    return res
      .status(200)
      .json(new ApiResponse(200, deletedLike, "Like Removed"));
  }

  if (!existingLike) {
    const newLike = await Like.create({ tweet: tweetId, likedBy: userId });
    if (!newLike) throw new ApiError(500, "Failed to create like");
    return res.status(201).json(new ApiResponse(201, newLike, "Like Added"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const userId = req.user._id;
  if (!userId) throw new ApiError(400, "User ID is required");
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: userId,
        video: { $ne: null }, // Ensure we only get likes on videos
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: video,
        foreignField: "_id",
        as: "videoDetails",
      },
    },
    {
      $unwind: "$videoDetails",
    },
    {
      $project: {
        _id: 1,
        video: "$videoDetails._id",
        videoFile: "$videoDetails.videoFile",
        title: "$videoDetails.title",
        thumbnail: "$videoDetails.thumbnail",
        likedBy: 1,
        createdAt: 1,
      },
    },
    {
      $sort: { createdAt: -1 }, // Sort by creation date, most recent first
    },
  ]);

  if (!likedVideos || likedVideos.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No liked videos found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Liked Videos fetch successfully"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
