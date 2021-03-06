const { ObjectId } = require("mongodb");
const fs = require("fs");
const { randomUUID } = require("crypto");
const path = require("path");
const {
  convertToObjectId,
  compressImages,
  buildUrlsForDB,
} = require("../../utils.js");
var Promise = require("bluebird");

const _ = require("lodash");
const utils = require("../../utils.js");
const bcrypt = require("bcrypt");
const { UUID } = require("bson");

module.exports = async (router, upload) => {
  const db = require("../../db.js");
  const users = await db.db["users"].collection("users");

  router.get("/collection", upload.none(), async (req, res) => {
    if (req.collection) {
      res.json(req.collection);
    } else {
      res.status(403).json();
    }
  });
};
