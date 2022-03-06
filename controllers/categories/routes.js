const { randomUUID } = require("crypto");
const { ObjectId } = require("mongodb");
const path = require("path");
const fs = require("fs");
const { constant } = require("lodash");
const queryString = require("query-string");
var boolParser = require("express-query-boolean");

const url = require("url");
module.exports = async (router, upload) => {
  const db = await require("../../db.js");

  router.get("/categories", async (req, res) => {
    const pages = await db.collection("categories").find().toArray();

    res.json(pages);
  });

  router.put("/categories/media", upload.single("image"), async (req, res) => {
    const data = JSON.parse(req.body.data);

    const query = req.query;

    const file = req.file;
    const collection = db.collection(data.category);
    const category = await db.collection("categories").findOne({
      _id: ObjectId(data.page_category),
    });

    const isMulti = category[
      query.mobile ? "editableFields_mobile" : "editableFields"
    ].find((item) => {
      return item.name === data.item.col;
    }).multi;

    const saveFolder = category.imageFolder;
    const filePath = path.join(saveFolder, randomUUID() + file.originalname);
    const new_url =
      "http://localhost:3000/" + path.join("mock-bb-storage", filePath);
    const savePath = path.posix.join("public", "mock-bb-storage", filePath);

    fs.writeFileSync(savePath, file.buffer);
    await collection.updateOne(
      {
        _id: new ObjectId(data.page),
        [`${data.item.col}._id`]: new ObjectId(data.item._id),
      },
      {
        $set: {
          [isMulti ? `${data.item.col}.$.url` : `${data.item.col}.url`]:
            new_url,
        },
      }
    );
  });
};
