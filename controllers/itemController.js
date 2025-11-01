const Item = require("../module/itemModule");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const mongoose = require("mongoose");

/**
 * Create a new Item
 */
exports.createItem = catchAsync(async (req, res, next) => {
  const data = req.body;

  // Optional: Basic validation
  if (!data.name) return next(new AppError("Item name is required", 400));
  if (!data.variants || !Array.isArray(data.variants) || data.variants.length === 0)
    return next(new AppError("At least one variant is required", 400));

  const itemDoc = await Item.create(data);

  res.status(201).json({ success: true, data: itemDoc });
});

/**
 * Update Weight (Add stock)
 */
exports.updateWeight = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { weight } = req.body;

  if (weight === undefined || typeof weight !== "number" || weight >= 0) {
    return next(new AppError("Weight value must be provided and must be a number", 400));
  }

  const itemDoc = await Item.findById(id);
  if (!itemDoc) return next(new AppError("No item found with this ID", 404));

  await itemDoc.addStock(weight);

  res.status(200).json({ success: true, data: itemDoc });
});

/**
 * Remove Weight (Remove stock)
 */
exports.removeWeight = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { weight } = req.body;

  if (weight === undefined || typeof weight !== "number" || weight <= 0) {
    return next(new AppError("Weight must be a positive number", 400));
  }

  const itemDoc = await Item.findById(id);
  if (!itemDoc) return next(new AppError("No item found with this ID", 404));

  await itemDoc.removeStock(weight);

  res.status(200).json({ success: true, data: itemDoc });
});

exports.findItems = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  console.log("Category ID from params:", id);

  const objectId = new mongoose.Types.ObjectId(id);
  const findItemById = await Item.find({ category: objectId });

  console.log("Found:", findItemById.length);

  res.status(200).json({
    message: "Success",
    data: findItemById,
  });
});

exports.getAllItems = catchAsync(async (req, res, next) => {
  const findItemById = await Item.find({});

  console.log("Found:", findItemById.length);

  res.status(200).json({
    message: "Success",
    data: findItemById,
  });
});
