const express = require("express");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const router = express.Router();

router.post("/findUser", authController.protect, userController.getMe);

router.post("/add-cart", authController.protect, userController.addCart);
router.patch("/update-cart", authController.protect, userController.updateCart);
router.delete("/update-cart/:id", authController.protect, userController.deleteCart);


module.exports = router;
