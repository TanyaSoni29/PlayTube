import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller";
import { verifyJwt } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyJwt);
router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/c/:id").delete(deleteComment).patch(updateComment);
