// Tests for the entire API, not super sure if this is best practice, probably I should write unit tests too
const { MongoClient } = require("mongodb");

// const { main } = require("./index")
const axios = require("axios").default; // FROM AXIOS README - In order to gain the TypeScript typings (for intellisense / autocomplete) while using CommonJS imports with require() use this approach

// const MONGO_TEST_URI = "mongodb://localhost:27017/testTodoDatabase?retryWrites=true&w=majority"
const MONGO_TEST_URI =
    "mongodb://localhost:27017/todoDatabase?retryWrites=true&w=majority";

describe("registration API works", () => {
    afterAll(async (done) => {
        const client = new MongoClient(MONGO_TEST_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        await client.connect();
        await client.db().dropDatabase()
        await client.close()
        done()
    });
    test("should register a new user with username and password", async (done) => {
        const res = await axios.post("http://localhost:4004/api/users/", {
            username: "newUser",
            password: "easytoguess",
        });
        expect(res.status).toEqual(201);
        expect(res.data.success).toBe(true)
        done();
    });

    test("should not register a user with a username that has been already used", async (done) => {
        try {
            const res = await axios.post("http://localhost:4004/api/users/", {
                username: "newUser",
                password: "anothereasytoguess",
            });
        } catch (err) {
            expect(err.response.status).toEqual(401);
            expect(err.response.data.success).toBe(false)
        }
        done();
    });
});

// Register a user

// Login the registered user

// Todos for a new user should be empty
