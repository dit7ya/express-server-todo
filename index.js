const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcrypt");
const morgan = require('morgan')

require("dotenv").config();

const {
    loginUser,
    createTodo,
    deleteTodo,
    createUser,
    getAllTodos,
    updateTodo,
    validateToken
} = require("./helpers.js");

const MONGODB_URI = process.env.MONGODB_URI

const main = async () => {
    const app = express();
    app.use(cors());

    app.use(morgan('dev'))
    app.use(express.json());

    const client = new MongoClient(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    await client.connect();

    app.get("/api", (req, res) => {
        res.send("<h1>Welcome to the todos API!</h1>"); // TODO FIXME
    });

    // Get all todos for the logged in user
    app.get("/api/todos", validateToken, async (req, res) => {
        const userId = req.decoded.id;
        const allTodos = await getAllTodos(client, userId);
        const result = {
            success: true,
            message: `Retrieved all todos for user ${userId}`,
            data: { allTodos: allTodos },
        };
        // send the result as JSON
        res.json(result);
    });
    // Create new todo with post request
    app.post("/api/todos", validateToken, async (req, res) => {
        try {
            const userId = req.decoded.id;
            const todoWithUserId = { ...req.body, userId };
            const insertedId = await createTodo(client, todoWithUserId);
            const result = {
                success: true,
                message: `New todo created with the following id: ${insertedId}`,
            };
            res.status(201).json(result);
        } catch (err) {

            const result = {
                success: false,
                message: err
            };
            res.status(401).json(result);
        }
    });

    app.delete("/api/todos/:id", validateToken, async (req, res) => {
        const todoId = req.params.id;
        await deleteTodo(client, todoId);
        const result = {
            success: true,
            message: `Todo deleted with the following id: ${todoId}`,
        };
        res.status(200).json(result);
    });


    // Update a todo with a patch request
    app.patch("/api/todos/", validateToken, async (req, res) => {
        const userId = req.decoded.id;
        const todoWithUserId = { ...req.body, userId };
        await updateTodo(client, todoWithUserId);
        const result = {
            success: true,
            message: `Todo updated with the following id: ${req.body._id}`,
        };
        res.json(result);
    });

    // register a new user
    app.post("/api/users", async (req, res) => {
        const body = req.body;

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(body.password, saltRounds);

        const user = {
            username: body.username,
            passwordHash,
        };
        try {
            const userId = await createUser(client, user);
            const result = {
                success: true,
                message: `User created with userId: ${userId}`
            }
            res.status(201).json(result);
        } catch (err) {
            const result = {
                success: false,
                message: err
            }
            res.status(401).json(result);
        }
    });

    // login a registered user
    app.post("/api/login", async (req, res) => {
        const userData = req.body;
        try {
            const token = await loginUser(client, userData);
            // res.send(token);
            const result = {
                success: true,
                message: "Logged in successfully.",
                data: { token: token }
            }
            res.json(result)
        } catch (err) {

            const result = {
                success: false,
                message: "Login unsuccessfull.",
            }
            res.status(401).json(result)
        }
    });

    const PORT = 3001;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

main()
