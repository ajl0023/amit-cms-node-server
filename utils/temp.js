const { writeFileSync, mkdirsSync } = require("fs-extra");
const { ObjectId } = require("mongodb");
const db = require("../dbb");
const path = require("path");
const { add } = require("lodash");
const { main, disconnect } = require("../dbb");

async function createControllersFolder() {
  const collection = (await db).collection("categories");
  const categories = await collection.find().toArray();
  categories.forEach((item) => {
    mkdirsSync(path.join("./controllers", item.category));
  });
  process.exit();
}

async function importData() {
  const collection = (await db).collection("categories");
  const data = require("./exported-data/categories.json");
  const formattedData = data.map((item) => {
    item._id = ObjectId(item._id);
    return item;
  });
  await collection.insertMany(formattedData);
  process.exit();
}
async function prefix_img() {
  const dev_pref = "http://localhost:3000";
  const prod_pref = "http://147.182.193.194";
  const collection = await (await db).collection("mobile").find().toArray();

  for (const item of collection) {
    const images = item.images.map((item) => {
      item.url = item.url.replace(
        "http://localhost:3000/",
        "http://147.182.193.194/"
      );
      return item;
    });

    await (await db).collection("mobile").updateOne(
      {
        _id: ObjectId(item._id),
      },
      {
        $set: {
          images: images,
        },
      }
    );
  }
  process.exit();
}

async function dataToJson() {
  const items = await (await db).collection("categories").find().toArray();
  writeFileSync("./exported-data/categories.json", JSON.stringify(items));
  process.exit();
}
async function editCol() {
  const connection = await db;
  const collection = connection.collection("page-carousels");
  const category = await collection.find().toArray();
  for (const item of category) {
    // if (item._id.equals("6219797fc02c8be7a9db17df")) {
    // const images = item.images.map((img) => {
    //   return {
    //     ...img,
    //     _id: ObjectId(),
    //   };
    // });
    const res = await collection.updateOne(
      {
        _id: item._id,
      },
      {
        $set: {
          category: ObjectId("62198b33f38911e118d08032"),
        },
      }
    );
  }
  // }
  process.exit();
}
async function addCol() {
  await main();
  const database = db.db["maliview"];
  const collection = database.collection("categories");
  const fetch = await collection.findOne({
    _id: ObjectId("62198a93ee6bf0f2610a1c31"),
  });
  const endpoints = fetch.endpoints;
  endpoints.push({
    route: "api/behind-the-scenes/phase",
    method: "POST",
    name: "Add Phase",
    type: "document",
  });
  endpoints_mobile = fetch.endpoints_mobile;
  endpoints_mobile.push({
    route: "/mobile/behind-the-scenes/phase",
    method: "POST",
    name: "Add Phase",
    type: "document",
  });
  await collection.updateOne(
    {
      _id: ObjectId("621ae8462b5171ada3bf1987"),
    },
    {
      $push: {
        endpoints: {
          $each: [
            {
              route: "/api/bg-pages/order",
              method: "PUT",
              name: "Save",
            },
          ],
        },
        endpoints_mobile: {
          $each: [
            {
              route: "/api/mobile/order",
              method: "PUT",
              name: "Save",
            },
          ],
        },
      },
    }
  );
  // process.exit(0);
  await disconnect();
}

async function replaceCategories() {
  await main();
  const maliview_cat = db.db["maliview"].collection("categories");
  const aviator_cat = db.db["aviator"].collection("categories");
  await aviator_cat.deleteMany();
  await aviator_cat.insertMany(await maliview_cat.find().toArray());
  await disconnect();
}
replaceCategories();
// module.exports = {
//   async insertIntoCarouselRenders() {
//     const collection = db.db["maliview"].collection("carousel-renders");
//     const images =
//       require("./images/maliview/images/renders/full/data.json").map((item) => {
//         return {
//           _id: ObjectId(),
//           order: item.order,
//           url:
//             "http://localhost:3000" +
//             item.path.replace("public", "").replace(/\\/gi, "/"),
//         };
//       });
//     const thumbs =
//       require("./images/maliview/images/renders/thumbs/data.json").map(
//         (item) => {
//           return {
//             _id: ObjectId(),
//             order: item.order,
//             url:
//               "http://localhost:3000" +
//               item.path.replace("public", "").replace(/\\/gi, "/"),
//           };
//         }
//       );
//     const left = images.filter((item) => {
//       const regex = /left/gi;
//       return item.url.search(regex) > 0;
//     });
//     const right = images.filter((item) => {
//       const regex = /right/gi;
//       return item.url.search(regex) > 0;
//     });

//     await collection.insertOne({
//       page: "renders",
//       left,
//       right,
//       thumbs,
//       category: ObjectId("62198b001837728ee4c572e0"),
//     });
//   },
// };
