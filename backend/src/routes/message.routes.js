import { Router } from "express";
import { sendMessage, allMessages } from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All message routes are protected
router.use(verifyJWT);

router.route("/").post(sendMessage);
router.route("/:chatId").get(allMessages);

export default router;
