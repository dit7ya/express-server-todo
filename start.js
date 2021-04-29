const { main } = require("./index")

require("dotenv").config();
const MONGODB_URI = process.env.MONGODB_URI

main(MONGODB_URI, 3001)
