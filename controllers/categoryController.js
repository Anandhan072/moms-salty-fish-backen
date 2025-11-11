const category = require("../module/categoryModule");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.addCategory = catchAsync(async (req, res, next) => {
  const body = req.body;

  const categoryAdd = await category.create(body);

  return res.status(201).json({
    status: "Successfully",
    data: categoryAdd,
  });
});

exports.getAllCategory = catchAsync(async (req, res, next) => {
  const { url: test } = req.query;
  console.log(test);
  if (test) {
    const categoryAll = await category.find({ url: test });
    return res.status(201).json({
      status: "Successfully",
      data: categoryAll,
    });
  }

  const categoryAll = await category.find({});
 return res.status(201).json({
    status: "Successfully",
    data: categoryAll,
  });
});

exports.getCategory = catchAsync(async (req, res, next) => {
  const id = req;
  console.log("check id:");

  const categoryAll = await category.find({});

  if (!categoryAll) {
    return res.status(404).json({ status: "fail", message: "Category not found" });
  }

  return res.status(200).json({
    status: "success",
    data: categoryAll,
  });
});
