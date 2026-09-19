import { Router } from "express";
import {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
} from "../controllers/chat.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All chat routes are protected
router.use(verifyJWT);

router.route("/").post(accessChat).get(fetchChats);
router.route("/group").post(createGroupChat);
router.route("/group/rename").patch(renameGroup);
router.route("/group/add").patch(addToGroup);
router.route("/group/remove").patch(removeFromGroup);

export default router;
