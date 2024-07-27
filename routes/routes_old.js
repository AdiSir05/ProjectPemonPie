const { OpenAI, ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const { CheerioWebBaseLoader } = require("langchain/document_loaders/web/cheerio");

const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { Document } = require("@langchain/core/documents");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { formatDocumentsAsString } = require("langchain/util/document");
const {
    RunnableSequence,
    RunnablePassthrough,
  } = require("@langchain/core/runnables");
const { Chroma } = require("@langchain/community/vectorstores/chroma");

const dbsingleton = require('../models/db_access.js');
const config = require('../config.json'); // Load configuration
const bcrypt = require('bcrypt'); 
const helper = require('./route_helper.js');
const { read } = require("fs");
const session = require("express-session");

// Database connection setup
const db = dbsingleton;

const PORT = config.serverPort;
var vectorStore = null;

var getHelloWorld = function(req, res) {
    res.status(200).send({message: "Hello, world!"});
}


var getVectorStore = async function(req) {
    if (vectorStore == null) {
        vectorStore = await Chroma.fromExistingCollection(new OpenAIEmbeddings(), {
            collectionName: "imdb_reviews2",
            url: "http://localhost:8000", // Optional, will default to this value
            });
    }
    return vectorStore;
}


// POST /register 
var postRegister = async function(req, res) {
    // TODO: register a user with given body parameters
    // Get the required fields
    // console.log("Register attempted");
    const username = req.body.username;
    const password = req.body.password;
    const linked_id = req.body.linked_id;

    // Check to make sure that all the fields exist
    if (!username || !password || !linked_id) {
        return res.status(400).json({error: "One or more of the fields you entered was empty, please try again."});
    }

    try {
        // Check to see if the username is already taken
        const userExists = await db.send_sql(`SELECT * FROM users WHERE username = "${username}"`);
        if (userExists.length > 0) {
            return res.status(409).json({error: "An account with this username already exists, please try again."});
        }
        // Encrypt the password
        helper.encryptPassword(password, async function(err, hashed_password) {
            if (err) {
                console.error(err);
                return;
            }

            // Call the insert_items request with this information
            await db.insert_items(`INSERT INTO users (username, hashed_password, linked_nconst) VALUES ("${username}", "${hashed_password}", "${linked_id}")`);
            req.session.user_id = await db.send_sql(`SELECT user_id FROM users WHERE username = "${username}"`);
            req.session.username = username;
            return res.status(200).json({username: username});
        });
    }
    catch (err) {
        console.log("Error: " + err);
        return res.status(500).json({error: "Error querying database: " + err});
    }
};


// POST /login
var postLogin = async function(req, res) {
    // TODO: check username and password and login
    const username = req.body.username;
    const password = req.body.password;

    try {
        if (!username || !password) {
            return res.status(400).json({error: "One or more of the fields you entered was empty, please try again."});
        }
        // Get the hashed_password from the database
        const user = await db.send_sql(`SELECT hashed_password, user_id FROM users WHERE username = "${username}"`);
        if (user[0] === undefined) {
            return res.status(401).json({error: "Username and/or password are invalid."});
        }
        
        
        // Check if the hashed_password is the same as the hashed_password from the db
        bcrypt.compare(password, user[0].hashed_password, function(err, result) {
            if (err) {
                console.error(err);
                return;
            }
            if (result) {
                req.session.user_id = user[0].user_id;
                req.session.username = username;
                return res.status(200).json({username: username});
            } else {
                console.log("Wrong password");
                return res.status(401).json({error: "Username and/or password are invalid."});
            }
        });
    }
    catch (err) {
        console.log("Error: " + err);
        return res.status(500).json({error: "Error querying database."});
    }
};


// GET /logout
var postLogout = function(req, res) {
  // TODO: fill in log out logic to disable session info
    req.session.user_id = null;
    req.session.username = null;
    res.status(200).json({message: "You were successfully logged out."});
};


// GET /friends
var getFriends = async function(req, res) {
    // TODO: get all friends of current user
    // Check and see if a user is logged in
    if (!helper.isLoggedIn(req, req.params.username)) {
        return res.status(403).json({error: "Not logged in."});
    }

    try {
        // const user = await db.send_sql(`SELECT user_id FROM users WHERE username = "${req.params.username}"`);
        // Get the friends of the current user
        const friends = await db.send_sql(`SELECT nconst AS followed, n.primaryName \
                FROM users u \
                JOIN friends f ON u.linked_nconst = f.follower \
                JOIN names n ON n.nconst = f.followed \
                WHERE u.user_id = ${req.session.user_id}`);

        const friends2 = friends.map((row) => ({
            followed: row.followed,
            primaryName: row.primaryName
        }))
        return res.status(200).json({results: friends2});
    }
    catch (err) {
        return res.status(500).json({error: "Error querying database."});
    }
}


// GET /recommendations
var getFriendRecs = async function(req, res) {
    // TODO: get all friend recommendations of current user
    // Check and see if a user is logged in
    if (!helper.isLoggedIn(req, req.params.username) || !helper.isOK(req.params.username)) {
        return res.status(403).json({error: "Not logged in."});
    }

    try {
        // const user = await db.send_sql(`SELECT user_id FROM users WHERE username = "${req.params.username}"`);

        // Get the recommendations of the current user
        const recs = await db.send_sql(`SELECT u.linked_nconst AS recommendation, n.primaryName \
                FROM users u \
                JOIN names n ON u.linked_nconst = n.nconst \
                JOIN recommendations r ON n.nconst = r.recommendation \
                JOIN users u2 ON r.person = u2.linked_nconst \
                WHERE u2.user_id = ${req.session.user_id}`);
        return res.status(200).json({results: recs});
    }
    catch (err) {
        return res.status(500).json({error: "Error querying database."});
    }
}


// POST /createPost
var createPost = async function(req, res) {
    // TODO: add to posts table
    // Check and see if a user is logged in
    if (!helper.isLoggedIn(req, req.params.username)) {
        return res.status(403).json({error: "Not logged in."});
    }

    // Get the required fields
    const title = req.body.title;
    const content = req.body.content;
    let parent_id = req.body.parent_id;

    // Check to make sure that all the fields exist
    if (!title || !content) {
        return res.status(400).json({error: "One or more of the fields you entered was empty, please try again."});
    }

    // Check to maek sure that the title and content are ok
    if (!helper.isOK(title) || !helper.isOK(content)) {
        return res.status(400).json({error: "One or more of the fields you entered was invalid, please try again."});
    }

    try {
        // Query for the user_id
        // const user = await db.send_sql(`SELECT user_id FROM users WHERE username = "${req.session.username}"`);
        // Call the insert_items request with this information
        await db.insert_items(`INSERT INTO posts (parent_post, title, content, author_id) VALUES (${parent_id}, "${title}", "${content}", ${req.session.user_id})`);
        return res.status(201).json({message: "Post created."});
    }
    catch (err) {
        return res.status(500).json({error: "Error querying database."});
    }
}

// GET /feed
var getFeed = async function(req, res) {
    // TODO: get the correct posts to show on current user's feed
    // Check and see if a user is logged in
    
    if (!helper.isLoggedIn(req, req.params.username)) {
        return res.status(403).json({error: "Not logged in."});
    }

    try {
        // const user = await db.send_sql(`SELECT user_id FROM users WHERE username = "${req.params.username}"`);

        // Get the feed of the current user
        const feed = await db.send_sql(`SELECT u.username, p.parent_post, p.title, p.content \
                FROM posts p \
                JOIN users u ON p.author_id = u.user_id \
                WHERE p.author_id = ${req.session.user_id}`);
        console.log(feed);
        return res.status(200).json({results: feed});
    }
    catch (err) {
        console.log("Error: " + err);
        return res.status(500).json({error: "Error querying database."});
    }
}


var getMovie = async function(req, res) {
    const vs = await getVectorStore();
    const retriever = vs.asRetriever();

    const prompt = PromptTemplate.fromTemplate(req.body.context);
    const llm = new ChatOpenAI({
        modelName: "gpt-3.5-turbo",
        apiKey: "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",
        temperature: 0
      });

    const ragChain = await createStuffDocumentsChain({
        llm,
        prompt: prompt,
        outputParser: new StringOutputParser(),
    })
    result = await ragChain.invoke({
        question: req.body.question,
    });
    console.log(result);
    res.status(200).json({message: result});
}


/* Here we construct an object that contains a field for each route
   we've defined, so we can call the routes from app.js. */

var routes = { 
    get_helloworld: getHelloWorld,
    post_login: postLogin,
    post_register: postRegister,
    post_logout: postLogout, 
    get_friends: getFriends,
    get_friend_recs: getFriendRecs,
    get_movie: getMovie,
    create_post: createPost,
    get_feed: getFeed
  };


module.exports = routes;

