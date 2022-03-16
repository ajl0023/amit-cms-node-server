const { promisify } = require("bluebird");
const { MongoClient } = require("mongodb");

let connection;

async function main() {
  const uri = process.env.URI;
  const client = new MongoClient(uri);

  connection = await client.connect();
  dbs["maliview"] = await setDB("maliview");
  dbs["aviator"] = await setDB("aviator");
  dbs["users"] = await setDB("amit-apel");
}

async function setDB(database) {
  const db = connection.db(database);
  return db;
}
const dbs = {
  maliview: null,
  aviator: null,
  db: null,
  users: null,
};

async function setCollection(collection) {
  module.exports["current_db"] = await dbs[collection];
}
async function disconnect() {
  if (connection) {
    await connection.close();
    console.log("connection closed");
    process.exit(0);
  }
}
module.exports = {
  db: dbs,
  main,
  setCollection,
  current_db: null,
  disconnect,
};

process.on("SIGINT", async () => {
  disconnect();
});
