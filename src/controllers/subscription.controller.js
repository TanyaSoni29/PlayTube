import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  if (!channelId) throw new ApiError(400, "Channel Id is required");
  if (!isValidObjectId(channelId))
    throw new ApiError(400, "Invalid Channel Id");

  const userId = req.userId._id;
  const existingSubscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (existingSubscription) {
    const deletedSubscription = await Subscription.findByIdAndDelete(
      existingSubscription._id
    );
    if (!deletedSubscription)
      throw new ApiError(500, "Failed to delete subscription");

    res
      .status(200)
      .json(new ApiResponse(200, deletedSubscription, "Unsubscribed"));
  }

  if (!existingSubscription) {
    const newSubscription = await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });

    if (!newSubscription)
      throw new ApiError(500, "Failed to create subscription");
    res
      .status(201)
      .json(new ApiResponse(201, newSubscription, "Subscribed successfully"));
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) throw new ApiError(400, "Channel Id is required");
  if (!isValidObjectId(channelId))
    throw new ApiError(400, "Invalid Channel Id");
  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
      },
    },
    {
      $unwind: "$subscriberDetails",
    },
    {
      $project: {
        _id: 0,
        subscriberId: "$subscriberDetails._id",
        subscriberName: "$subscriberDetails.username",
        subscriberFullName: "$subscriberDetails.fullName",
        subscriberAvatar: "$subscriberDetails.avatar",
      },
    },
    {
      $sort: {
        createdAt: -1, // Sort by subscriber details, e.g., by creation date
      },
    },
  ]);

  if (!subscribers || subscribers.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No subscribers found"));
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers Fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!subscriberId) throw new ApiError(400, "Subscriber Id is required");
  if (!isValidObjectId(subscriberId))
    throw new ApiError(400, "Invalid Subscriber Id");
  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails",
      },
    },
    {
      $unwind: "$channelDetails",
    },
    {
      $project: {
        _id: 0,
        channelId: "$channelDetails._id",
        channelName: "$channelDetails.username",
        channelFullName: "$channelDetails.fullName",
        channelAvatar: "$channelDetails.avatar",
      },
    },
    {
      $sort: {
        createdAt: -1, // Sort by subscription date
      },
    },
  ]);

  if (!subscribedChannels || subscribedChannels.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, [], "No subscribed channels found"));
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Subscribed Channels Fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
