module.exports = async (router, upload) => {
  router.get("/mobile", async (req, res) => {
    const pages = await db.current_db.collection("mobile").find({}).toArray();
    res.json(pages);
  });
  router.delete("/mobile", async (req, res) => {
    const collection = db.current_db.collection(req.body.category);
    const promises = [];
    const deletedItems = req.body.deleted;

    for (const page in deletedItems) {
      if (Object.hasOwnProperty.call(deletedItems, page)) {
        const ids = deletedItems[page].map((id) => {
          return ObjectID(id);
        });
        promises.push(
          collection.updateOne(
            {
              _id: ObjectID(page),
            },
            {
              $pull: {
                images: {
                  _id: {
                    $in: ids,
                  },
                },
              },
            }
          )
        );
      }
    }
    await Promise.all(promises);
    res.json("yo");
  });
};
