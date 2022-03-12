const { MongoClient } = require("mongodb");

let connection;

async function main() {
  const uri =
    "mongodb+srv://a:a@cluster0.2e6a1.mongodb.net/maliview?retryWrites=true&w=majority";

  const client = new MongoClient(uri);

  connection = await client.connect();
  dbs["maliview"] = await setDB("maliview");
  dbs["aviator"] = await setDB("aviator");
}

async function setDB(database) {
  const db = connection.db(database);
  return db;
}
const dbs = {
  maliview: null,
  aviator: null,
  db: null,
};
let current_db;
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
