const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/bannerController.js");
const authController = require("../controllers/authController.js");

router.post(
  "/",
  authController.protect,
  authController.restrictTo("admin"),
  bannerController.addBanner
);

router.get("/", bannerController.getAllBanner);

// CRUD

module.exports = router;
