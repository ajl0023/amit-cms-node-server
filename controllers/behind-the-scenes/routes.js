const { ObjectId } = require("mongodb");
const fs = require("fs");
const { randomUUID } = require("crypto");
const path = require("path");
const {
  convertToObjectId,
  compressImages,
  buildUrlsForDB,
} = require("../../utils.js");
const _ = require("lodash");
const utils = require("../../utils.js");
module.exports = async (router, upload) => {
  const db = require("../../db.js");
  router.get("/behind-the-scenes", async (req, res) => {
    const pages = await db.current_db
      .collection("behind-the-scenes")
      .find({})
      .toArray();

    res.json(pages);
  });
  router.put(
    "/behind-the-scenes",
    upload.fields([
      {
        name: "images",
      },
    ]),
    async (req, res) => {
      const images = req.files.images;
      const data = req.body;

      const category = await db.current_db.collection("categories").findOne({
        _id: ObjectId(data.category),
      });
      const compress = compressImages(images, category.imageFolder);
      const compressed = await Promise.all(compress);
      const collection = db.current_db.collection("behind-the-scenes");
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
      res.json("nice");
    }
  );
  router.delete("/behind-the-scenes/phase", async (req, res) => {
    const deleted = await db.current_db
      .collection("behind-the-scenes")
      .deleteOne({
        _id: ObjectId(req.body._id),
      });
    res.json(deleted);
  });
  router.delete(
    "/behind-the-scenes",
    upload.fields([{ name: "images" }]),
    async (req, res) => {
      const collection = db.current_db.collection(req.body.category);
      const promises = [];
      const deletedItems = req.body.deleted;
      console.log(deletedItems);
      for (const page in deletedItems) {
        if (Object.hasOwnProperty.call(deletedItems, page)) {
          const selected = deletedItems[page].items;
          for (const item of selected) {
            const column = "images";

            promises.push(
              collection.updateOne(
                {
                  _id: new ObjectId(page),
                  [`${column}._id`]: new ObjectId(item._id),
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

  router.post(
    "/behind-the-scenes/phase",
    upload.fields([
      {
        name: "images",
      },
    ]),
    async (req, res) => {
      const data = req.body;

      const category = await db.current_db
        .collection("categories")
        .findOne({ _id: ObjectId(data._id) });
      const collection = db.current_db.collection("behind-the-scenes");
      if (!_.isEmpty(req.files.images)) {
        const images = req.files.images;
        const compress = compressImages(images, category.imageFolder);
        const compressed = await Promise.all(compress);
        const get_max = await collection
          .find()
          .sort({ order: -1 })
          .limit(1)
          .toArray();
        const starting_order = get_max.length > 0 ? get_max[0].order : 0;
        const insert_data = {
          images: compressed.map((item, i) => {
            return {
              _id: ObjectId(),
              url: buildUrlsForDB(item, category.imageFolder),
              order: i,
            };
          }),
          order: starting_order + 1,
          page: "behind-the-scenes",
          phase: req.body.phase ? parseInt(req.body.phase) : 0,
          category: ObjectId(category._id),
        };
        const insert = await collection.insertOne(insert_data);
        res.json(insert);
      }
    }
  );
};
