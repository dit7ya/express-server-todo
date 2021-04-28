const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { validateToken } = require("./utils.js");

const app = express();
app.use(cors());
app.use(express.json()); // for parsing application/json
// app.use(validateToken)

const PASSWORD = process.env.MONGODB_ATLAS_HALUM_PASSWORD;
const MONGODB_URI = `mongodb+srv://halum:${PASSWORD}@cluster0.qz9n6.mongodb.net/todoDatabase?retryWrites=true&w=majority`;

async function loginUser(client, userData) {
    // console.log(userData)
    const user = await client
        .db("todoDatabase")
        .collection("users")
        .findOne({ username: userData.username });

    // console.log(userData);

    const passwordCorrect =
        user === null
            ? false
            : await bcrypt.compare(userData.password, user.passwordHash);

    if (!(user && passwordCorrect)) {
        return Promise.reject("username or password incorrect");
    }

    const userForToken = {
        username: user.username,
        id: user._id,
    };
    const options = { expiresIn: "2d", issuer: "halum-todo-app" };
    const token = jwt.sign(userForToken, process.env.SECRET, options);
    return Promise.resolve(token);
}

async function createUser(client, user) {
    const userExists = await client
        .db("todoDatabase")
        .collection("users")
        .findOne({ username: user.username });
    if (userExists) {
        return Promise.reject("Username is already taken.");
    } else {
        const result = await client
            .db("todoDatabase")
            .collection("users")
            .insertOne(user);
        return Promise.resolve(
            `New user created with the following id: ${result.insertedId}`
        );
    }
}

async function createTodo(client, todo) {
    const result = await client
        .db("todoDatabase")
        .collection("todos")
        .insertOne(todo);
    console.log(`New todo created with the following id: ${result.insertedId}`);
}

const getAllTodos = async (client, userId) => {
    const result = await client
        .db("todoDatabase")
        .collection("todos")
        .find({ userId: userId })
        .toArray();
    return result;
};

const deleteTodo = async (client, filter) => {
    console.log("Filer is ", filter);
    const result = await client
        .db("todoDatabase")
        .collection("todos")
        .deleteOne(filter);

    console.log(`Todo deleted`);
};

const updateTodo = async (client, todo) => {
    const result = await client
        .db("todoDatabase")
        .collection("todos")
        .replaceOne({ _id: todo._id }, todo);

    console.log(`Todo updated`);
};

const main = async () => {
    const client = new MongoClient(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    await client.connect();
    app.get("/", (request, response) => {
        response.send("<h1>Welcome to the todo API!</h1>");
    });

    app.get("/api/todos", validateToken, (request, response) => {

        const userId = request.decoded.id
        // console.log(request.decoded);
        getAllTodos(client, userId).then((x) => response.send(x));
    });
    app.post("/api/newTodo", validateToken, (req, res) => {
        // console.log(req);
        const userId = req.decoded.id
        const todoWithUserId = { ...req.body, userId }
        // console.log(consol)
        createTodo(client, todoWithUserId).then(res.send("Todo created"));
    });

    app.post("/api/updateTodo", (req, res) => {
        // console.log(req.body);
        updateTodo(client, req.body).then(res.send("Todo updated"));
    });

    app.post("/api/deleteTodo", (req, res) => {
        // console.log("THE API RECEIVES req.body", req.body);
        deleteTodo(client, req.body).then(res.send("todo deleted"));
    });

    app.post("/api/users", async (request, response) => {
        const body = request.body;

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(body.password, saltRounds);

        const user = {
            username: body.username,
            passwordHash,
        };
        try {
            const result = await createUser(client, user);
            response.send(result);
        } catch {
            response.status(401).send("Username taken."); // FIXME figure out the correct status code
        }
    });

    app.post("/api/login", async (request, response) => {
        const user = request.body;
        try {
            const token = await loginUser(client, user);
            response.send(token);
        } catch {
            response.status(401).send("Username or password incorrect.");// FIXME figure out the correct status code
        }
    });

    const PORT = 3001;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

main().then(console.log);
