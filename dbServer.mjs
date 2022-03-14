import { MongoMemoryServer } from "mongodb-memory-server";

// This will create an new instance of "MongoMemoryServer" and automatically start it
const mongod = await MongoMemoryServer.create();

const uri = mongod.getUri();

// The Server can be stopped again with
