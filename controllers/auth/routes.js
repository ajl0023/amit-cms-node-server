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

  router.post("/auth/login", upload.none(), async (req, res) => {
    
    const req_data = req.body;
    console.log(req_data);
    const user = await users.findOne({
      username: req_data.username,
    });

    if (user) {
      bcrypt.compare(req_data.password, user.password, async (err, result) => {
        if (result === true) {
          const access_token = randomUUID();
          await users.updateOne(
            {
              _id: ObjectId(user._id),
            },
            {
              $set: {
                access_token,
              },
            }
          );
          res.status(200).json({
            session_id: access_token,
          });
        } else {
          res.status(403).json({});
        }
      });
    } else {
      res.status(403).json({});
    }

    // const users = await db.current_db
    //   .collection("behind-the-scenes")
    //   .find({})
    //   .toArray();
    // res.json(pages);
  });
};
