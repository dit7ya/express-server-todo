// In the following functions, client is a MongoDB client
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken')

const loginUser = async (client, userData) => {
    const user = await client
        .db("todoDatabase")
        .collection("users")
        .findOne({ username: userData.username });

    const passwordCorrect =
        user === null
            ? false
            : await bcrypt.compare(userData.password, user.passwordHash);

    if (!(user && passwordCorrect)) {
        return Promise.reject("Username or password incorrect");
    }

    const userForToken = {
        username: user.username,
        id: user._id,
    };
    const options = { expiresIn: "2d", issuer: "halum-todo-app" };
    const token = jwt.sign(userForToken, process.env.SECRET, options);
    return Promise.resolve(token);
};

const createUser = async (client, user) => {
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
        return Promise.resolve(result.insertedId);
    }
};

const createTodo = async (client, todo) => {
    try {
        const result = await client
            .db("todoDatabase")
            .collection("todos")
            .insertOne(todo);
        return Promise.resolve(result.insertedId)
    } catch (err) {
        return Promise.reject(err)
    }
};

const getAllTodos = async (client, userId) => {
    const result = await client
        .db("todoDatabase")
        .collection("todos")
        .find({ userId: userId })
        .toArray();
    return result;
};

const deleteTodo = async (client, todoId) => {
    const filter = { _id: todoId };
    const result = await client
        .db("todoDatabase")
        .collection("todos")
        .deleteOne(filter);
    return result;
};

const updateTodo = async (client, todo) => {
    const result = await client
        .db("todoDatabase")
        .collection("todos")
        .replaceOne({ _id: todo._id }, todo);
    return result;
};


const validateToken = (req, res, next) => {
    const authorizationHeader = req.headers.authorization;
    let result;
    if (authorizationHeader) {
        const token = req.headers.authorization.split(' ')[1]; // Bearer <token>
        const options = {
            expiresIn: '2d',
            issuer: 'halum-todo-app'
        };
        try {
            // make sure that the token hasn't expired and has been issued by us
            result = jwt.verify(token, process.env.SECRET, options);

            // pass back the decoded token to the request object
            req.decoded = result;
            // pass execution to the subsequent middleware
            next();
        } catch (err) {
            // Throw an error just in case anything goes wrong with verification
            throw new Error(err);
        }
    } else {
        result = {
            success: false,
            message: `Authentication error. Token required.`,
        };
        res.status(401).send(result);
    }
}
module.exports = {
    loginUser,
    createUser,
    getAllTodos,
    createTodo,
    deleteTodo,
    updateTodo,
    validateToken
};
