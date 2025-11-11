const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController.js");
const authController = require("../controllers/authController.js");

router.post(
  "/add-new-category",
  authController.protect,
  authController.restrictTo("admin"),
  categoryController.addCategory
);

router.get("/:id", categoryController.getCategory);

router.get("/", categoryController.getAllCategory);
module.exports = router;
