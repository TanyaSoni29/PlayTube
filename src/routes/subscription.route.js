import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller";
const router = Router();

router.use(verifyJwt);

router.route("/toggle/c/:channelId").post(toggleSubscription);
router.route("/u/:channelId").get(getUserChannelSubscribers);
router.route("/c/:subscriberId").get(getSubscribedChannels);
