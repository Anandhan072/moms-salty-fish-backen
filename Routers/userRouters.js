const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const router = express.Router();

router.post("/findUser", authController.protect, userController.getMe);

module.exports = router;
