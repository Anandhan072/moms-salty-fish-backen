const User = require("../module/useModule");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({ _id: req.body.itemId });

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  // The protect middleware already attaches req.user
  if (!req.user) return next(new AppError("No authenticated user", 401));

  // Return safe user data
  const { password, refreshToken, otp, otpExpires, ...safeUser } = req.user.toObject();

  res.status(200).json({
    status: "success",
    data: {
      user: safeUser,
    },
  });
});

// ✅ controllers/userController.js

exports.updateCart = catchAsync(async (req, res, next) => {
  if (!req.user) return next(new AppError("No authenticated user. Please sign in first.", 401));

  const { itemId, variantId, quantity, weight } = req.body;

  if (!itemId || !variantId || !quantity || !weight)
    return next(new AppError("Missing required fields (itemId, variantId, quantity)", 400));

  console.log(itemId, variantId, quantity, weight);

  // 🛒 Find and update the user's cart
  const user = await User.findById(req.user.id);
  if (!user) return next(new AppError("User not found", 404));

  console.log(user);

  // 🧩 Check if item already exists in cart
  const existingItem = user.userProductInfo.cart.some(
    (item) => item.itemId.toString() === itemId && item.variantId.toString() === variantId
  );

  console.log("Existing Item:", existingItem);

  if (existingItem) {
    // Update quantity
    existingItem.quantity = quantity;
  } else {
    // Add new item
    user.userProductInfo.cart.push({ itemId, variantId, quantity, weight });
  }

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Cart updated successfully",
    data: { cart: user.userProductInfo.cart },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined!",
  });
};
