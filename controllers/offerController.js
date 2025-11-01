const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const offer = require("../module/offerModule");

////
exports.createOffer = catchAsync(async (req, res, next) => {
  const getOffer = await offer.create(req.body);

  if (!getOffer) next(new AppError("Offer Not Created", 400));

  res.status(201).json({ status: "Success", message: "account", data: getOffer });
});

exports.getAllOffer = catchAsync(async (req, res, nex) => {
  const allOffer = await offer.find({});

  if (!allOffer) next(new AppError("No offer Founded", 400));

  res.status(201).json({ status: "Success", message: "AllOffer", data: allOffer });
});
