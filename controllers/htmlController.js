const fs = require("fs");
const path = require("path");

const readHtmlFiles = function (val) {
  return fs.readFileSync(`${__dirname}/../public/html/items.html`, "utf-8");
};

const readFrontHtmlFiles = function (val) {
  return fs.readFileSync(`${__dirname}/../public/html/frontend/${val}.html`, "utf-8");
};

exports.getItems = (req, res) => {
  const pathname = req.path.split("/").slice(1)[2];
  const result = readHtmlFiles(pathname);
  console.log(result);

  res.status(200).json({
    status: "successful",
    data: result,
    htmlPage: pathname,
  });
};

exports.getFrontItem = (req, res) => {
  const page = req.query.page;
  const findHtml = readFrontHtmlFiles(page);
  res.status(201).json({
    status: "Successfully",
    data: findHtml,
    path: page,
  });
};
