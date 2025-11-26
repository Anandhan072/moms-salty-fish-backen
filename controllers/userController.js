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
  // This looks more like "get user by id" than "get all users"
  // If you really want "all users", just do: const users = await User.find();
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
  if (!req.user) return next(new AppError("No authenticated user", 401));

  const { password, refreshToken, otp, otpExpires, ...safeUser } =
    req.user.toObject();

  res.status(200).json({
    status: "success",
    data: {
      user: safeUser,
    },
  });
});

/* ============================================================
   ADD TO CART
============================================================ */

exports.addCart = catchAsync(async (req, res, next) => {
  if (!req.user)
    return next(
      new AppError("No authenticated user. Please sign in first.", 401)
    );

  const { itemId, variantId, quantity, weight } = req.body;

  if (!itemId || !variantId || !quantity || !weight) {
    return next(
      new AppError(
        "Missing required fields (itemId, variantId, quantity, weight).",
        400
      )
    );
  }

  const user = await User.findById(req.user.id);
  if (!user) return next(new AppError("User not found", 404));

  const cart = user.userProductInfo.cart || [];

  // 🔍 Find existing item (not .some, we need the actual item)
  const existingItem = cart.find(
    (item) =>
      item.itemId.toString() === itemId.toString() &&
      item.variantId.toString() === variantId.toString()
  );

  if (existingItem) {
    // Update quantity (you can choose += here if you want incremental add)
    existingItem.quantity = quantity;
    existingItem.weight = weight;
  } else {
    // Add new item
    cart.push({ itemId, variantId, quantity, weight });
  }

  user.userProductInfo.cart = cart;

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Cart updated successfully",
    data: { cart: user.userProductInfo.cart },
  });
});

/* ============================================================
   UPDATE CART QUANTITY
============================================================ */

exports.updateCart = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(
      new AppError("No authenticated user. Please sign in first.", 401)
    );
  }

  const { updateQty, cartId } = req.body;

  if (!updateQty || !cartId) {
    return next(
      new AppError("Quantity and Cart ID are required fields.", 400)
    );
  }

  const user = await User.findById(req.user.id);
  if (!user) return next(new AppError("User not found", 404));

  const cart = user.userProductInfo.cart;

  if (!cart || cart.length === 0) {
    return next(
      new AppError("You don't have any items in your cart.", 404)
    );
  }

  const cartItem = cart.find(
    (item) => item._id.toString() === cartId.toString()
  );

  if (!cartItem) {
    return next(new AppError("Cart item not found.", 404));
  }

  const qty = Number(updateQty);
  if (qty < 1 || qty > 10) {
    return next(new AppError("Quantity must be between 1 and 10.", 400));
  }

  cartItem.quantity = qty;

  await user.save();

  res.status(200).json({
    status: "success",
    message: "Cart updated successfully",
    data: {
      cart: user.userProductInfo.cart,
    },
  });
});

/* ============================================================
   DELETE CART ITEM
============================================================ */

exports.deleteCart = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(
      new AppError("No authenticated user. Please sign in first.", 401)
    );
  }

  const { id } = req.params;

  if (!id) {
    return next(new AppError("Cart ID is required.", 400));
  }

  const user = await User.findById(req.user.id);
  if (!user) return next(new AppError("User not found", 404));

  const cart = user.userProductInfo.cart;

  if (!cart || cart.length === 0) {
    return next(
      new AppError("You don't have any items in your cart.", 404)
    );
  }

  // ✅ Correct way: use filter, not reduce
  const updatedCart = cart.filter(
    (item) => item._id.toString() !== id.toString()
  );

  // If length not changed, item wasn't found
  if (updatedCart.length === cart.length) {
    return next(new AppError("Cart item not found.", 404));
  }

  user.userProductInfo.cart = updatedCart;

  await user.save();

  res.status(200).json({
    status: "success",
    message: "Cart item removed successfully",
    data: {
      cart: user.userProductInfo.cart,
    },
  });
});
