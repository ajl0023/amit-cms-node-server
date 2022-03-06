const { existsSync } = require("fs");
const fs = require("fs-extra");

const path = require("path");
const sharp = require("sharp");
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

require("dotenv").config();

module.exports = (db) => {
  const express = require("express");
  const app = express();
  const port = 3000;

  app.use(
    "/mock-bb-storage",

    async (req, res) => {
      const formatted_url = decodeURIComponent(req.originalUrl);

      const filePath = path.posix.join(__dirname, "public", formatted_url);
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

  const knex = require("./knexInstance");
  const router2 = express.Router();
  const router3 = express.Router();
  const mobileRoutes = express.Router();
  const cors = require("cors");
  const boolParser = require("express-query-boolean");
  const { Model } = require("objection");

  Model.knex(knex);

  // require("./routes")(router, db);
  require("./controllers/bg-pages/routes")(router, upload);
  require("./controllers/categories/routes")(router, upload);
  require("./controllers/mobile/routes")(router, upload);
  require("./controllers/behind-the-scenes/routes")(router, upload);
  require("./controllers/page-carousels/routes")(router, upload);
  require("./controllers/carousel-renders/routes")(router, upload);

  require("./db-routes")(router3, db);
  app.use(boolParser());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(cors());
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
