const express = require("express");
const htmlController = require("../controllers/htmlController");

const router = express.Router();

router.get("/", htmlController.getFrontItem);

router.route("/business/inventory/items").get(htmlController.getItems);

module.exports = router;
