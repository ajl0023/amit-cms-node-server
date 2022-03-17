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
  const db = require("../../db.js");

  router.get("/bg-pages", async (req, res) => {
    const pages = await db.current_db.collection("bg-pages").find({}).toArray();

    res.json(pages);
  });
  router.post("/bg-pages/new", async (req, res) => {
    const database = "aviator";
    const currentFolder = "bg-pages";
    const collection = "bg-pages";
    const subFolder = "contact";
    const curr_order = 2;
    const page = subFolder.replace("-", " ");

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
      type: "image",
      order: curr_order,
      category: ObjectId("62198acfee737dc5b139ea71"),
      image: {
        url:
          `http://localhost:${process.env.SERVER_PORT}/` +
          imagesPath[0].path.replace(/public\\/i, "").replace(/\\/gi, "/"),
        _id: ObjectId(),
      },
    });

    res.json({});
  });
  router.delete("/bg-pages", async (req, res) => {
    const collection = db.current_db.collection(req.body.category);
    const promises = [];
    const deletedItems = req.body.deleted;

    for (const page in deletedItems) {
      if (Object.hasOwnProperty.call(deletedItems, page)) {
        const selected = deletedItems[page].items;
        for (const item of selected) {
          const column = "image";

          promises.push(
            collection.updateOne(
              {
                _id: ObjectId(page),
                [`${column}._id`]: ObjectId(item._id),
              },
              {
                $set: {
                  [`${column}`]: {},
                },
              }
            )
          );
        }
      }
    }
    await Promise.all(promises);
    res.json({});
  });
  router.put("/bg-pages", upload.single("image"), async (req, res) => {
    console.log(req.file);
    const images = [req.file];
    const data = req.body;
    const video_url = req.body.video_url;
    const collection = db.current_db.collection("bg-pages");

    const category = await db.current_db.collection("categories").findOne({
      _id: ObjectId(data.category),
    });
    const insertQuery = {
      $set: {},
    };
    if (req.file) {
      const compress = compressImages(images, category.imageFolder);
      const compressed = await Promise.all(compress);

      const insert_data = compressed.map((item, i) => {
        return {
          _id: ObjectId(),
          url: buildUrlsForDB(item, category.imageFolder),
          order: i,
        };
      });
      insertQuery["$set"] = {
        image: insert_data[0],
      };
    }

    if (video_url) {
      insertQuery["$set"]["video_url"] = video_url;
    }

    await collection.updateOne(
      {
        _id: ObjectId(data._id),
      },
      {
        ...insertQuery,
      }
    );
    res.json({});
  });
};
