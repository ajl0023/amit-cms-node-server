const crypto = require("crypto");
const sharp = require("sharp");
const fs = require("fs-extra");
const axios = require("axios").default;
var _ = require("lodash");
const imageType = require("image-type");

const path = require("path");
const { ObjectId } = require("mongodb");

const stream = require("stream");

module.exports = {
  async downloadImage(url) {
    const buffer = await axios.get(url, {
      responseType: "arraybuffer",
    });

    return buffer.data;
  },
  compressImages(images, folderName) {
    const compressed = images.map((image) => {
      const fileName = path.parse(image.originalname);
      const image_type = imageType(image.buffer);

      const sharpInst = sharp(image.buffer);
      const new_fileName = crypto.randomUUID() + fileName.name + fileName.ext;
      return sharpInst.metadata().then((metadata) => {
        const savePath = path.join(
          "./public/",
          "mock-bb-storage",
          folderName,
          new_fileName
        );

        if (metadata.width >= 1200) {
          if (image_type.ext !== "png") {
            return sharpInst
              .resize({ width: 1100 })
              .jpeg({
                quality: 95,
              })
              .toFile(savePath)
              .then(() => {
                return new_fileName;
              });
          } else {
            return sharpInst
              .resize({ width: 1100 })
              .png({
                quality: 75,
              })
              .toFile(savePath)
              .then(() => {
                return new_fileName;
              });
          }
        } else {
          return sharpInst.toFile(savePath).then(() => {
            return new_fileName;
          });
        }
      });
    });

    return compressed;
  },

  buildUrlsForDB(file, folder) {
    const host = process.env.SERVER_PORT
      ? `http://localhost:${process.env.SERVER_PORT}/`
      : "https://test12312312356415616.store/";
    const base = "mock-bb-storage";

    const url = host + path.join(base, folder, file).split(path.sep).join("/");
    return url;
  },
  async getImageMetaData(img) {
    const metadata = await sharp(img).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
    };
  },
  async getCurrentConnection() {},
  uploadImage: async function (files, parentId) {
    if (!_.isEmpty(files)) {
      for (const field in files) {
        if (Object.hasOwnProperty.call(files, field)) {
          const images = files[field]; // array of images
          const savePaths = images.map((item) => {
            const pathToSave = path.join("./public/images", item.originalname);
            return fs
              .writeFile(pathToSave, item.buffer)
              .then(async () => {
                return {
                  file: item.originalname,
                  uploadData: await this.getImageMetaData(item.buffer),
                };
              })
              .then((data) => {
                const metadata = data.uploadData;
                return Images.query().insert({
                  url: data.file,
                  width: metadata.width,
                  main: field === "thumbnail" ? true : false,
                  height: metadata.height,
                  parentId: parentId,
                });
              });
          });

          await Promise.all(savePaths);
        }
      }
    }
  },

  async convertToObjectId(data, key, element) {
    count++;
    if (typeof data === "object" && !Array.isArray(data)) {
      if (data.$oid) {
        element[key] = ObjectId(data.$oid);
        return;
      } else {
        for (const key in data) {
          const element = data[key];
          this.convertToObjectId(element, key, data);
        }
        return;
      }
    }

    for (let i = 0; i < data.length; i++) {
      const element = data[i];

      for (const key in element) {
        const item = element[key];

        if (item["$oid"]) {
          element[key] = ObjectId(element[key]["$oid"]);
        }

        if (
          typeof item === "object" &&
          !Array.isArray(item) &&
          !ObjectId.isValid(item)
        ) {
          this.convertToObjectId(item, key, element);
        } else {
        }
      }
    }

    return data;
  },

  ObjToArr(obj) {
    return Object.entries(obj).map(([k, v]) => {
      return { ...v, name: _.startCase(k) };
    });
  },

  getModel(category) {
    const rootDirectory = path.resolve("./models");

    const filename = path.join(rootDirectory, category, category);

    if (filename.indexOf(rootDirectory) !== 0) {
      return;
    }
    const Model = require(filename).model;
    return Model;
  },
  flatten(data, category) {
    const main_data = data[category];
    const images = {};
    for (const key in main_data.properties) {
      if (Object.hasOwnProperty.call(main_data.properties, key)) {
        const element = main_data.properties[key];
        images[key] = {
          label: null,
          images: [],
          uid: element.images[0].key,
        };
        for (const image of element.images) {
          image["parentId"] = image.key;

          image["isMain"] = image["tags"][1] === "true";
          images[key]["images"].push(image);
          if (image.label) {
            images[key]["label"] = image.label;
          }
        }
      }
    }
    return images;
  },
  parseJSON(file) {
    return JSON.parse(file);
  },

  async getMediaCols(Model) {},
  async compressImage(buffer) {
    const metadata = await sharp(buffer).metadata();
    const image = sharp(buffer);
    let result = {};
    if (metadata.width >= 950) {
      result["image"] = await image
        .resize({ width: 900 })

        .toBuffer();
    } else {
      result["image"] = await image
        .resize({ width: 900 })

        .toBuffer();
    }
    result["metadata"] = metadata;
    return result;
  },
};
