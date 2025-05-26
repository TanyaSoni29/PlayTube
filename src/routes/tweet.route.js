import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller";

const router = Router();

router.use(verifyJwt);

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:id").patch(updateTweet).delete(deleteTweet);
