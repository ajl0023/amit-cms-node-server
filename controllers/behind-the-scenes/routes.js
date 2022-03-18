const { ObjectId } = require("mongodb");
const fs = require("fs");
const { randomUUID } = require("crypto");
const path = require("path");
const {
  convertToObjectId,
  compressImages,
  buildUrlsForDB,
} = require("../../utils.js");
var Promise = require("bluebird");

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
      res.json({});
    }
  );
  router.delete("/behind-the-scenes/phase", async (req, res) => {
    const deleted = await db.current_db
      .collection("behind-the-scenes")
      .deleteOne({
        _id: ObjectId(req.body._id),
      });
    res.json({});
  });
  router.delete(
    "/behind-the-scenes",
    upload.fields([{ name: "images" }]),
    async (req, res) => {
      const collection = db.current_db.collection("behind-the-scenes");
      const promises = [];
      const deletedItems = req.body.deleted;

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
                  $pull: {
                    [`${[column]}`]: {
                      _id: ObjectId(item._id),
                    },
                  },
                }
              )
            );
          }
        }
      }
      const update = await Promise.all(promises);

      res.json({});
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
      if (req.files && !_.isEmpty(req.files.images)) {
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
        res.json({});
      } else {
        res.json({});
      }
    }
  );
  router.put("/behind-the-scenes/order", async (req, res) => {
    const req_data = req.body;
    const set_id = req_data.set_id;
    const ordered_images = req_data.images;
    const collection = db.current_db.collection("behind-the-scenes");
    Promise.each(ordered_images, (img) => {
      return collection.updateOne(
        { _id: ObjectId(set_id), "images._id": ObjectId(img._id) },
        {
          $set: {
            "images.$.order": img.order,
          },
        }
      );
    });
    res.json({});
  });
};
