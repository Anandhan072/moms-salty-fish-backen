const express = require("express");

const authController = require("../controllers/authController.js");
const offerController = require("../controllers/offerController.js");

const router = express.Router();

router.post(
  "/",
  authController.protect,
  authController.restrictTo("admin"),
  offerController.createOffer
);

router.get("/", offerController.getAllOffer);
module.exports = router;
