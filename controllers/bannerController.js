const banner = require("../module/bannerModule");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.addBanner = catchAsync(async (req, res, next) => {
  const body = req.body;
  console.log(body);

  const bannerNew = await banner.create(body);
  res.status(201).json({
    success: true,
    data: bannerNew,
  });
});

exports.getAllBanner = catchAsync(async (req, res, next) => {
  const bannerNew = await banner.find();
  res.status(201).json({
    success: true,
    data: bannerNew,
  });
});
