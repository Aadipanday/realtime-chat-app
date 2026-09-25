import { Router } from "express";
import {
  sendMessage,
  allMessages,
  deleteMessage,
  markMessagesAsRead,
  reactToMessage,
} from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// All message routes are protected
router.use(verifyJWT);

router.route("/").post(upload.single("file"), sendMessage);
router.route("/read/:chatId").patch(markMessagesAsRead);
router.route("/:messageId/react").patch(reactToMessage);
router.route("/:chatId").get(allMessages);
router.route("/:messageId").delete(deleteMessage);

export default router;
