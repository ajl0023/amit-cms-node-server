const { ObjectId } = require("mongodb");
// const { insertIntoCarouselRenders } = require("../../temp.js");
const { compressImages, buildUrlsForDB } = require("../../utils.js");
var Promise = require("bluebird");
module.exports = async (router, upload) => {
  const db = require("../../db.js");

  router.get("/carousel-renders", async (req, res) => {
    const fetched = await db.current_db
      .collection("carousel-renders")
      .find({}, {})
      .toArray();

    res.json(fetched);
  });
  router.put("/carousel-renders/order", async (req, res) => {
    const req_data = req.body;
    const set_id = req_data.set_id;
    const ordered_images = req_data.images;
    const column = req.body.column;
    const collection = db.current_db.collection("carousel-renders");

    Promise.each(ordered_images, (img) => {
      return collection.updateOne(
        { _id: ObjectId(set_id), [`${column}._id`]: ObjectId(img._id) },
        {
          $set: {
            [`${column}.$.order`]: img.order,
          },
        }
      );
    });
    res.json({});
  });
  router.post("/carousel-renders/new", async (req, res) => {
    // insertIntoCarouselRenders();
    res.json({});
  });

  router.delete("/carousel-renders", async (req, res) => {
    const collection = db.current_db.collection(req.body.category);
    const promises = [];
    const deletedItems = req.body.deleted;

    for (const page in deletedItems) {
      if (Object.hasOwnProperty.call(deletedItems, page)) {
        const items = deletedItems[page].items;
        const columns = items.reduce((acc, item) => {
          if (!acc[item.column]) {
            acc[item.column] = [item];
          } else {
            acc[item.column].push(item);
          }
          return acc;
        }, {});
        for (const column in columns) {
          const idsToDelete = columns[column].map((item) => {
            return ObjectId(item._id);
          });

          promises.push(
            collection.updateMany(
              {},
              {
                $pull: {
                  [`${column}`]: {
                    _id: {
                      $in: idsToDelete,
                    },
                  },
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
  router.put(
    "/carousel-renders",
    upload.fields([{ name: "thumbs" }, { name: "left" }, { name: "right" }]),
    async (req, res) => {
      const images = req.files.images;
      const data = req.body;

      const category = await db.current_db.collection("categories").findOne({
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

      const collection = db.current_db.collection("carousel-renders");

      await collection.updateOne(
        {
          _id: ObjectId(data._id),
        },
        {
          $push: queries,
        }
      );
      res.json({});
    }
  );
};
