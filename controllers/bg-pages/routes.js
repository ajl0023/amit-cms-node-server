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
  router.get("/bg-pages", async (req, res) => {
    const pages = await db.collection("bg-pages").find({}).toArray();

    res.json(pages);
  });
  router.post("/bg-pages/new", async (req, res) => {
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
  router.delete("/bg-pages", async (req, res) => {
    const collection = db.collection(req.body.category);
    const promises = [];
    const deletedItems = req.body.deleted;

    for (const page in deletedItems) {
      if (Object.hasOwnProperty.call(deletedItems, page)) {
        const selected = deletedItems[page];
        for (const item of selected) {
          const column = "image";

          promises.push(
            collection.updateOne(
              {
                _id: new ObjectId(page),
                [`${column}._id`]: new ObjectId(item),
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
  });
  router.put("/bg-pages", upload.single("image"), async (req, res) => {
    const images = [req.file];
    const data = req.body;

    const category = await db.collection("categories").findOne({
      _id: ObjectId(data.category),
    });
    const compress = compressImages(images, category.imageFolder);
    const compressed = await Promise.all(compress);
    const collection = db.collection("bg-pages");
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
        $set: {
          image: insert_data[0],
        },
      }
    );
    res.json("nice");
  });
};
