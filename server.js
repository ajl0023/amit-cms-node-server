const { existsSync } = require("fs");
const fs = require("fs-extra");

const path = require("path");
const sharp = require("sharp");
const multer = require("multer");
const { getCurrentConnection } = require("./utils");
const { db, setCollection, current_db } = require("./db");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const url = require("url");
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

require("dotenv").config();

module.exports = () => {
  const express = require("express");
  const app = express();
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(cors());
  const port = 8080;
  require("./controllers/auth/routes")(app, upload);
  app.use("/api", async (req, res, next) => {
    const cookies = req.cookies;

    const users = await db["users"].collection("users");
    const token = cookies.access_token;

    if (token) {
      const admin = await users.findOne({
        username: "admin",
      });
      if (admin.access_token === token) {
        req.user = {
          is_loggedIn: true,
        };

        next();
      } else {
        res.status(403).json();
        return;
      }
    } else {
      res.status(403).json();
      return;
    }
  });
  app.use("/api", async (req, res, next) => {
    const cookies = req.cookies;

    const collection = cookies.collection;

    await setCollection(collection);

    next();
  });

  app.use(
    "/mock-bb-storage",

    async (req, res, next) => {
      if (!req.query.size) {
        res.sendFile("public/" + decodeURIComponent(req.originalUrl), {
          root: __dirname,
        });
        return;
      }

      const formatted_url = decodeURIComponent(req._parsedUrl.pathname);
      const filePath = path.posix.join("public", formatted_url);
      const fileName = path.parse(filePath);
      const sharpStream = sharp({
        failOnError: false,
      });
      const readStream = fs.createReadStream(filePath);
      readStream.on("open", async function () {
        // This just pipes the read stream to the response object (which goes to the client)
        readStream.pipe(sharpStream);
        const savePath = path.join("./temp", fileName.base + fileName.ext);
        if (existsSync(savePath)) {
          res.sendFile(savePath, {
            root: __dirname,
          });
          return;
        }
        await sharpStream
          .resize({
            width: 100,
            height: 100,
          })
          .toFile(savePath);
        res.sendFile(savePath, {
          root: __dirname,
        });
      });
    }
  );

  var router = express.Router();

  const router2 = express.Router();
  const router3 = express.Router();

  const boolParser = require("express-query-boolean");

  // require("./routes")(router, db);
  require("./controllers/user/routes")(router, upload);
  require("./controllers/bg-pages/routes")(router, upload);
  require("./controllers/categories/routes")(router, upload);
  require("./controllers/mobile/routes")(router, upload);
  require("./controllers/behind-the-scenes/routes")(router, upload);
  require("./controllers/page-carousels/routes")(router, upload);
  require("./controllers/carousel-renders/routes")(router, upload);

  require("./db-routes")(router3, db);
  app.use(boolParser());

  app.use("/api", router);

  // app.use("/static", express.static("public"));
  app.use("/mock-bb-storage", () => {});
  app.use(router2);
  app.use("/db", router3);

  const server = app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });

  return server;
};
