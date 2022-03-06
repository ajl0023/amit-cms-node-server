const { ObjectId } = require("mongodb");
const fs = require("fs");
const { randomUUID } = require("crypto");
const path = require("path");
const {
  convertToObjectId,
  compressImages,
  buildUrlsForDB,
} = require("../../utils.js");
const utils = require("../../utils.js");
module.exports = async (router, upload) => {
  const db = await require("../../db.js");
  router.get("/page-carousels", async (req, res) => {
    const pages = await db.collection("page-carousels").find({}).toArray();
    res.json(pages);
  });
  router.delete(
    "/page-carousels",
    upload.fields([{ name: "images" }]),
    async (req, res) => {
      const collection = db.collection(req.body.category);
      const promises = [];
      const deletedItems = req.body.deleted;

      for (const page in deletedItems) {
        if (Object.hasOwnProperty.call(deletedItems, page)) {
          const selected = deletedItems[page];
          for (const item of selected) {
            const column = "images";

            promises.push(
              collection.updateOne(
                {
                  _id: new ObjectId(page),
                  [`${column}._id`]: new ObjectId(item),
                },
                {
                  $set: {
                    [`${column}.$.url`]: null,
                  },
                }
              )
            );
          }
        }
      }
      const update = await Promise.all(promises);
    }
  );
  router.put(
    "/page-carousels",
    upload.fields([
      {
        name: "images",
      },
    ]),
    async (req, res) => {
      const images = req.files.images;
      const data = req.body;

      const category = await db.collection("categories").findOne({
        _id: ObjectId(data.category),
      });
      const compress = compressImages(images, category.imageFolder);
      const compressed = await Promise.all(compress);
      const collection = db.collection("page-carousels");
      const insert_data = compressed.map((item, i) => {
        return {
          _id: ObjectId(),
          url: buildUrlsForDB(item, category.imageFolder),
          order: i,
        };
      });

      await collection.updateOne(
        {
          _id: ObjectId(data._id),
        },
        {
          $push: {
            images: {
              $each: insert_data,
            },
          },
        }
      );
    }
  );
};
