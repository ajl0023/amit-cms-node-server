let connection;

import server from "./server.js";
import db from "./db.js";

// import test4 from "./test4.js";
async function main() {
  await db.main();
  server();
}
main();
