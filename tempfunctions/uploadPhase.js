async function main() {
  const data = req.body;

  //   const category = await db.db.maliview
  //     .collection("categories")
  //     .findOne({ _id: ObjectId(data._id) });
  //   const collection = db.db.maliview.collection("behind-the-scenes");
  //   console.log(req.files);
  //   if (req.files && !_.isEmpty(req.files.images)) {
  //     const images = req.files.images;
  //     const compress = compressImages(images, category.imageFolder);
  //     const compressed = await Promise.all(compress);
  //     const get_max = await collection
  //       .find()
  //       .sort({ order: -1 })
  //       .limit(1)
  //       .toArray();
  //     const starting_order = get_max.length > 0 ? get_max[0].order : 0;
  //     const insert_data = {
  //       images: compressed.map((item, i) => {
  //         return {
  //           _id: ObjectId(),
  //           url: buildUrlsForDB(item, category.imageFolder),
  //           order: i,
  //         };
  //       }),
  //       order: starting_order + 1,
  //       page: "behind-the-scenes",
  //       phase: req.body.phase ? parseInt(req.body.phase) : 0,
  //       category: ObjectId(category._id),
  //     };
  //     const insert = await collection.insertOne(insert_data);
  //     res.json("success");
  //   } else {
  //     res.json({});
  //   }
}
main();
