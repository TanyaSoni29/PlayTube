import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyJwt);
