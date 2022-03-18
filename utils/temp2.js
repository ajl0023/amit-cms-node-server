const { ObjectId } = require("mongodb");
const { doc } = require("prettier");
require("dotenv").config();
const { main, db, disconnect } = require("../db");
let dev = true;
const server_url = "https://test12312312356415616.store/";
const local_url = `http://localhost:${process.env.SERVER_PORT}/`;
let old_url, new_url;
if (dev) {
  old_url = server_url;
  new_url = local_url;
} else {
  old_url = local_url;
  new_url = server_url;
}
async function changePrefixOfAllImages() {
  await main();

  const references = [];
  const tables = {
    maliview: [
      "behind-the-scenes",
      "bg-pages",
      "carousel-renders",
      "mobile",
      "page-carousels",
    ],
    aviator: ["bg-pages", "mobile", "page-carousels"],
  };

  for (const collection in tables) {
    if (Object.hasOwnProperty.call(tables, collection)) {
      for (const category of tables[collection]) {
        const connection = db[collection].collection(category);
        const documents = await connection.find().toArray();

        for (const item of documents) {
          for (const key in item) {
            if (key === "image") {
              references.push(item[key]);
              const image = item[key];

              if (image.url) {
                const url = image.url;
                image["old_url"] = image.url;

                image["url"] = url.replace(old_url, new_url);
                await connection.updateOne(
                  { _id: ObjectId(item._id) },
                  {
                    $set: {
                      [key]: item[key],
                    },
                  }
                );
              }
            } else if (
              key === "images" ||
              key === "phases" ||
              key === "left" ||
              key === "right" ||
              key === "thumbs"
            ) {
              if (key === "phases") {
                item[key] = item[key].map((item, i) => {
                  item["images"]
                    .filter((item) => {
                      return item.url;
                    })
                    .map((img) => {
                      if (img.url) {
                        const url = img.url;
                        img["old_url"] = url.replace(new_url, old_url);
                        img["url"] = url.replace(old_url, new_url);
                        return img;
                      }
                      return img;
                    });
                  return item;
                });
              } else {
                item[key] = item[key]
                  .filter((item) => {
                    return item.url;
                  })
                  .map((item) => {
                    if (item.url) {
                      const url = item.url;
                      item["old_url"] = url.replace(new_url, old_url);
                      item["url"] = url.replace(old_url, new_url);
                      return item;
                    }
                    return item;
                  });
              }

              await connection.updateOne(
                { _id: ObjectId(item._id) },
                {
                  $set: {
                    [key]: item[key],
                  },
                }
              );
              references.push(...item[key]);
            }
          }
        }
      }
    }
  }

  await disconnect();
  process.exit(0);
}
changePrefixOfAllImages();
