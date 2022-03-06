const { ObjectId } = require("mongodb");
const { compressImages, buildUrlsForDB } = require("../../utils.js");

module.exports = async (router, upload) => {
  const db = await require("../../db.js");
  router.get("/carousel-renders", async (req, res) => {
    const fetched = await db
      .collection("carousel-renders")
      .find({}, {})
      .toArray();

    res.json(fetched);
  });
  router.delete("/carousel-renders", async (req, res) => {
    const collection = db.collection(req.body.category);
    const promises = [];
    const deletedItems = req.body.deleted;

    for (const page in deletedItems) {
      if (Object.hasOwnProperty.call(deletedItems, page)) {
        const selected = deletedItems[page];
        for (const item of selected) {
          const column = item.col;

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
    await Promise.all(promises);

    res.json("test");
  });
  router.put(
    "/carousel-renders",
    upload.fields([{ name: "thumbs" }, { name: "left" }, { name: "right" }]),
    async (req, res) => {
      const images = req.files.images;
      const data = req.body;

      const category = await db.collection("categories").findOne({
        _id: ObjectId(data.category),
      });

      const image_sets = {};
      const queries = {};
      for (const set in req.files) {
        if (Object.hasOwnProperty.call(req.files, set)) {
          const compress = compressImages(req.files[set], category.imageFolder);
          image_sets[set] = await Promise.all(compress);
          image_sets[set] = image_sets[set].map((item, i) => {
            return {
              _id: ObjectId(),
              url: buildUrlsForDB(item, category.imageFolder),
              order: i,
            };
          });
          queries[set] = {
            $each: image_sets[set],
          };
        }
      }

      const collection = db.collection("carousel-renders");

      await collection.updateOne(
        {
          _id: ObjectId(data._id),
        },
        {
          $push: queries,
        }
      );
    }
  );
};
