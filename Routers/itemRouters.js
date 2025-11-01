const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController.js");
const authController = require("../controllers/authController.js");

// CRUD
router.post(
  "/",
  authController.protect,
  authController.restrictTo("admin"),
  itemController.createItem
);

router.get("/", itemController.getAllItems);
router.post(
  "/:id",
  authController.protect,
  authController.restrictTo("admin"),
  itemController.updateWeight
);

router.get("/:id", itemController.findItems);

module.exports = router;
