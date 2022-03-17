const path = require("path");
const { main, disconnect, db } = require("../db");
require("dotenv").config({
  path: ".env",
});
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
              const image = item[key];

              if (image.old_url) {
                references.push(image.old_url);
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
                  const images = item["images"]
                    .filter((item) => {
                      return item.old_url;
                    })
                    .map((img) => {
                      return img.old_url;
                    });
                  references.push(...images);
                });
              } else {
                item[key] = item[key]
                  .filter((item) => {
                    return item.old_url;
                  })
                  .map((item) => {
                    if (item.old_url) {
                      return item.old_url;
                    } else {
                    }
                  });
                references.push(...item[key]);
              }
            }
          }
        }
      }
    }
  }
  const paths = references.map((item) => {
    return path.parse(item);
  });
  console.log(paths);
  // await compareFiles(paths);
  await disconnect();
  process.exit(0);
}

async function compareFiles(references) {
  const FileHound = require("filehound");
  const fs = require("fs-extra");
  const files = await FileHound.create().paths("./public").find();
  const formatted = files.map((file) => {
    return path.parse(file);
  });
  const items_to_del = [];
  for (const file of formatted) {
    if (
      references.find((item) => {
        return item.base === file.base;
      })
    ) {
      items_to_del.push(file);
    }
  }
  for (const item of items_to_del) {
    const new_path = path.format(item).replace("public", "public2");
    const parsed = path.parse(new_path);
    if (!fs.existsSync(parsed.dir)) {
      fs.mkdirSync(parsed.dir, {
        recursive: true,
      });
    }
    fs.copyFileSync(path.format(item), new_path);
  }
  await fs.emptyDir("./temp");
  await fs.rm("./public", {
    recursive: true,
  });
  await fs.rename("./public2", "./public");
}
changePrefixOfAllImages();
