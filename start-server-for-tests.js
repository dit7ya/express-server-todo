// this is for testing only
const { main } = require("./index")

const MONGO_TEST_URI = "mongodb://localhost:27017/testTodoDatabase?retryWrites=true&w=majority"
main(MONGO_TEST_URI, 4004)
