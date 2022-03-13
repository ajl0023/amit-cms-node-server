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

  router.get("/page-carousels", async (req, res) => {
    const pages = await db.current_db
      .collection("page-carousels")
      .find({})
      .toArray();
    res.json(pages);
  });
  router.post("/page-carousels/new", async (req, res) => {
    const database = "aviator";
    const currentFolder = "page-carousels";
    const collection = "bg-pages";
    const subFolder = "video-render";
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

    const page = "video render";

    const curr_order = 0;

    await db.db[database].collection(collection).insert({
      page: page,
      type: "image",
      order: curr_order,
      category: ObjectId("62198acfee737dc5b139ea71"),
      image: {
        url:
          "http://localhost:3000/" +
          imagesPath[0].path.replace(/public\\/i, "").replace(/\\/gi, "/"),
        _id: ObjectId(),
      },
    });

    res.json("nice");
  });
  router.delete(
    "/page-carousels",
    upload.fields([{ name: "images" }]),
    async (req, res) => {
      const collection = db.current_db.collection(req.body.category);
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

      const category = await db.current_db.collection("categories").findOne({
        _id: ObjectId(data.category),
      });
      const compress = compressImages(images, category.imageFolder);
      const compressed = await Promise.all(compress);
      const collection = db.current_db.collection("page-carousels");
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
  router.put("/page-carousels/order", async (req, res) => {
    console.log(23);
  });
};
