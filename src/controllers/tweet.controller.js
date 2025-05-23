import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const ownerId = req.user._id;
  const { content } = req.body;

  if (!content) throw new ApiError(401, "Content field is required.");

  const newTweet = await Tweet.create({
    owner: ownerId,
    content: content,
  });

  if (!newTweet)
    throw new ApiError(500, "Something went wrong while creating Tweet");

  res
    .status(201)
    .json(new ApiResponse(201, newTweet, "Tweet Created Successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!userId) throw new ApiError(401, "User Id is required");

  const skip = (page - 1) * limit;

  const userTweets = await Tweet.aggregate([
    {
      $match: {
        owner: mongoose.Types.ObjectId(userId),
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    { $skip: skip },
    { $limit: limit },
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
  ]);

  if (!userTweets)
    throw new ApiError(500, "Something went wrong while fetching user tweet");

  res
    .status(200)
    .json(new ApiResponse(200, userTweets, "User tweet fetch successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { id } = req.params;
  const { content } = req.body;

  if (!id || !content) throw new ApiError(401, "Content is required");

  const updatedTweet = await Tweet.findByIdAndUpdate(
    id,
    { content: content },
    { new: true }
  );

  if (!updatedTweet)
    throw new ApiError(500, "Something went wrong while updating the tweet");

  res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet Updated Successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { id } = req.params;

  if (!id) throw new ApiError(401, "Tweet Id is required");

  const deletedTweet = await Tweet.findByIdAndDelete(id);

  if (!deletedTweet)
    throw new ApiError(500, "Something went wrong while deleting the tweet");

  res
    .status(204)
    .json(new ApiResponse(204, deletedTweet, "Tweet Deleted Successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
