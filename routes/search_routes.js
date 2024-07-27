const dbsingleton = require('../models/db_access.js');
const config = require('../config.json');
const helper = require('../routes/route_helper.js');
const { read } = require("fs");
const session = require("express-session");

// Database connection setup
const db = dbsingleton;

const PORT = config.serverPort;

// const apiKey = process.env.OPENAI_API_KEY;
// const configuration = new ConfigurationOptions({
//     apiKey: apiKey
//   });
// const api = new OpenAIApi(configuration);


// Search for people
// Parameters stored in req.body: search_string
var postSearchPeople = async function(req, res) {
    const search_string = req.body.search_string;

    // if (search_string == null) {
    //     return helper.sendError(res, "Search string is null");
    // }

    // try {
    //     // Query to database that returns all usernames, first names, last names, and image URLs
    //     const query = "SELECT username, first_name, last_name, image_url FROM users WHERE username ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1";
    //     const values = [`%${search_string}%`]; // Use ILIKE for case-insensitive matching and '%' wildcards for partial matches
    //     const dbResults = await db.query(query, values);

    //     // Optional: Use OpenAI to process or rank the results
    //     const names = dbResults.rows.map(row => `${row.first_name} ${row.last_name}`).join(", ");
    //     const prompt = `Provide a concise summary of search results for people related to the search query "${search_string}": ${names}`;
        
    //     const aiResponse = await openai.createCompletion({
    //         model: "text-davinci-003", // Use appropriate model
    //         prompt: prompt,
    //         max_tokens: 100
    //     });

    //     // Combine AI response with DB results or modify based on AI insights
    //     const processedResults = {
    //         dbResults: dbResults.rows,
    //         aiSummary: aiResponse.data.choices[0].text.trim()
    //     };

    //     res.json(processedResults);
    // } catch (error) {
    //     console.error('Error during search:', error);
    //     res.status(500).send({ error: "Failed to perform search" });
    // }

    return null;
}

// Search for posts
// Parameters stored in req.body: search_string
var postSearchPosts = async function(req, res) {

    // TO-DO: Implement search for posts
    return null;
}


var routes = {
    post_search_people: postSearchPeople,
    post_search_posts: postSearchPosts
  };


module.exports = routes;

