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
const _ = require("lodash");
module.exports = async (router, upload) => {
  const db = await require("../../db.js");
  router.get("/mobile", async (req, res) => {
    const pages = await db.collection("mobile").find({}).toArray();
    res.json(pages);
  });
  router.post("/mobile/new", async (req, res) => {
    const currentFolder = "bg-pages";
    const collection = "bg-pages";
    // const imagesPath = require(path.join("./images", currentFolder, "images"));
    const page = "equestrian";
    const subFolder = "equestrian";

    const db_data = await convertToObjectId.bind(utils)(
      require("./bg-pages.json")
    );

    const imageData1 = JSON.parse(
      fs.readFileSync(
        path.join("./images", currentFolder, subFolder, "data.json")
      )
    );

    for (const item of db_data) {
      console.log(item);
      const keys = Object.keys(item);

      await db.collection(collection).insert({
        ...item,
      });
    }

    res.json("nice");
  });
  router.delete(
    "/mobile/behind-the-scenes",
    upload.fields([{ name: "images" }]),
    async (req, res) => {
      const collection = db.collection("mobile");
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
                    "image._id": ObjectId(item._id),
                  },
                ],
              }
            );
          }
        }
      }
      const update = await Promise.all(promises);
      res.json("finished");
    }
  );
  router.delete(
    "/mobile/behind-the-scenes/phase",
    upload.fields([{ name: "images" }]),
    async (req, res) => {
      const collection = db.collection("mobile");
      const promises = [];
      const deletedItems = req.body.phase;
      await collection.updateOne(
        { _id: ObjectId(req.body.page) },
        {
          $pull: {
            phases: {
              phase: req.body.phase,
            },
          },
        }
      );

      const update = await Promise.all(promises);
      res.json("finished");
    }
  );
  router.delete(
    "/mobile",
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
            );
          }
        }
      }
      const update = await Promise.all(promises);
    }
  );
  router.post(
    "/mobile/behind-the-scenes",
    upload.fields([
      {
        name: "images",
      },
    ]),
    async (req, res) => {
      const data = req.body;

      const category = await db
        .collection("categories")
        .findOne({ _id: ObjectId(data.category) });

      const collection = db.collection("mobile");

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
        console.log(insert);
      }
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
      const file = req.files;
      const data = req.body;

      const category = await db.collection("categories").findOne({
        _id: ObjectId(data.category),
      });
      const images = req.files.phases;
      const phase = parseInt(data.phase);
      const compress = compressImages(images, category.imageFolder);
      const compressed = await Promise.all(compress);
      const collection = db.collection("mobile");
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
      res.json("nice");
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

      const category = await db.collection("categories").findOne({
        _id: ObjectId(data.category),
      });
      const compress = compressImages(images, category.imageFolder);
      const compressed = await Promise.all(compress);
      const collection = db.collection("mobile");
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
