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
  router.get("/logged-in", upload.none(), async (req, res) => {
    res.json(444);
    if (req.user && req.user.is_loggedIn) {
      res.json();
    } else {
      res.status(403).json();
    }
  });
};
