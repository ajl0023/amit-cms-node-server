const { ObjectId } = require("mongodb");
const fs = require("fs");
const { randomUUID } = require("crypto");
const path = require("path");
var Promise = require("bluebird");
const {
  convertToObjectId,
  compressImages,
  buildUrlsForDB,
} = require("../../utils.js");
const utils = require("../../utils.js");
const _ = require("lodash");
const { main } = require("../../db.js");
module.exports = async (router, upload) => {
  const db = require("../../db.js");

  router.get("/mobile", async (req, res) => {
    const pages = await db.current_db.collection("mobile").find({}).toArray();
    res.json(pages);
  });
  router.post(
    "/mobile/behind-the-scenes/phase",
    upload.fields([
      {
        name: "images",
      },
    ]),
    async (req, res) => {
      const data = req.body;
      await main();

      const category = await db.db["maliview"]
        .collection("categories")
        .findOne({ _id: ObjectId(data.category) });

      const collection = db.db["maliview"].collection("mobile");

      if (!_.isEmpty(req.files.images)) {
        const images = req.files.images;

        const compress = compressImages(images, category.imageFolder);
        const compressed = await Promise.all(compress);
        const insert_data = {
          images: compressed.map((item, i) => {
            return {
              _id: ObjectId(),
              url: buildUrlsForDB(item, category.imageFolder),
              order: i,
            };
          }),
          phase: req.body.phase ? parseInt(req.body.phase) : 0,
        };
        const insert = await collection.updateOne(
          {
            _id: ObjectId(data._id),
          },
          {
            $push: {
              phases: insert_data,
            },
          }
        );

        res.json({});
      }
    }
  );
  router.post("/mobile/new", async (req, res) => {
    const database = "aviator";
    const currentFolder = "bg-pages";
    const collection = "mobile";
    const subFolder = "contact";
    const page = "contact";
    const category = "62198acfee737dc5b139ea71";
    const curr_order = 1;
    const imagesPath = JSON.parse(
      fs.readFileSync(
        path.join(
          "./images",
          database,

          "images",
          currentFolder,
          subFolder,
          "data.json"
        )
      )
    );

    await db.db[database].collection(collection).insert({
      page: page,
      type: "bg-image",
      order: curr_order,
      category: ObjectId(category),
      images: imagesPath.map((img) => {
        return {
          _id: ObjectId(),

          url:
            "http://localhost:3000" +
            img.path.replace("public", "").replace(/\\/gi, "/"),
        };
      }),
    });

    res.json({});
  });
  router.delete(
    "/mobile/behind-the-scenes",
    upload.fields([{ name: "images" }]),
    async (req, res) => {
      const collection = db.current_db.collection("mobile");
      const promises = [];
      const deletedItems = req.body.deleted;

      for (const page in deletedItems) {
        if (Object.hasOwnProperty.call(deletedItems, page)) {
          const selected = deletedItems[page];
          for (const item of selected) {
            promises.push;
            collection.updateOne(
              {
                _id: new ObjectId(page),
              },
              {
                $set: {
                  "phases.$[].images.$[image].url": null,
                },
              },
              {
                arrayFilters: [
                  {
                    "image._id": ObjectId(item),
                  },
                ],
              }
            );
          }
        }
      }
      const update = await Promise.all(promises);
      res.json({});
    }
  );
  router.delete(
    "/mobile/behind-the-scenes/phase",
    upload.fields([{ name: "images" }]),
    async (req, res) => {
      const collection = db.current_db.collection("mobile");
      console.log(req.body.phase);
      await collection.updateOne(
        { _id: ObjectId(req.body._id) },
        {
          $pull: {
            phases: {
              phase: req.body.phase,
            },
          },
        }
      );

      res.json({});
    }
  );
  router.delete(
    "/mobile",
    upload.fields([{ name: "images" }]),
    async (req, res) => {
      const collection = db.current_db.collection(req.body.category);
      const promises = [];
      const deletedItems = req.body.deleted;

      for (const page in deletedItems) {
        if (Object.hasOwnProperty.call(deletedItems, page)) {
          const selected = deletedItems[page];
          for (const item of selected) {
            const column = "images";

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
            );
          }
        }
      }
      const update = await Promise.all(promises);
      res.json({});
    }
  );

  router.put(
    "/mobile/behind-the-scenes",
    upload.fields([
      {
        name: "phases",
      },
    ]),
    async (req, res) => {
      const data = req.body;

      const category = await db.current_db.collection("categories").findOne({
        _id: ObjectId(data.category),
      });
      const images = req.files.phases;
      const phase = parseInt(data.phase);
      const compress = compressImages(images, category.imageFolder);
      const compressed = await Promise.all(compress);
      const collection = db.current_db.collection("mobile");
      const insert_data = compressed.map((item, i) => {
        return {
          _id: ObjectId(),
          url: buildUrlsForDB(item, category.imageFolder),
          order: i,
        };
      });

      await collection.updateOne(
        {
          _id: new ObjectId(data._id),
        },
        {
          $push: {
            "phases.$[outer].images": {
              $each: insert_data,
            },
          },
        },
        {
          arrayFilters: [{ "outer.phase": phase }],
        }
      );
      res.json({});
    }
  );
  router.put(
    "/mobile",
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

      const collection = db.current_db.collection("mobile");

      const fields = category.editableFields_mobile;

      const input_data = {
        $set: {},
        $push: {},
      };
      for (const field of fields) {
        if (field.type === "string") {
          input_data["$set"][field.name] = data[field.name];
        }
      }

      if (images) {
        const compress = compressImages(images, category.imageFolder);
        const compressed = await Promise.all(compress);

        input_data["$push"]["images"] = {
          $each: compressed.map((item, i) => {
            return {
              _id: ObjectId(),
              url: buildUrlsForDB(item, category.imageFolder),
              order: i,
            };
          }),
        };
      }

      await collection.updateOne(
        {
          _id: ObjectId(data._id),
        },
        {
          ...input_data,
        }
      );
      res.json({});
    }
  );
  router.put("/mobile/order", async (req, res) => {
    const req_data = req.body;
    const set_id = req_data.set_id;
    const ordered_images = req_data.images;
    const collection = db.current_db.collection("mobile");
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
  router.put(
    "/mobile/behind-the-scenes/order",

    async (req, res) => {
      const req_data = req.body;
      const set_id = req_data.set_id;
      const ordered_images = req_data.images;
      const phase = req_data.phase;

      const collection = db.current_db.collection("mobile");
      Promise.each(ordered_images, (img) => {
        return collection.updateOne(
          {
            _id: new ObjectId(set_id),
          },
          {
            $set: {
              "phases.$[outer].images.$[image].order": img.order,
            },
          },
          {
            arrayFilters: [
              { "outer.phase": phase },
              {
                "image._id": ObjectId(img._id),
              },
            ],
          }
        );
      });
      res.json({});
    }
  );
};
