const dbsingleton = require('../models/db_access.js');
const config = require('../config.json');
const { read } = require("fs");
const session = require("express-session");
const faceModule = require('../models/chroma_access.js');
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

// Database connection setup
const db = dbsingleton;
const PORT = config.serverPort;

// Intilialize face models
faceModule.initializeFaceModels();

const { fromIni } = require("@aws-sdk/credential-provider-ini");

require('dotenv').config();

const credentials = fromIni({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    sessionToken: process.env.SESSION_TOKEN
});

// Initialize the S3 client with your region
const s3Client = new S3Client({region: "us-east-1", credentials: credentials });


// Based on the current user photo, get the top 5 most similar actors
// Parameters stored in req.body: user_id
var getActorRecommendations = async function(req, res) {
    try {
        
        // Get user_id from request session
        const user_id = req.session.user_id;
        
        // Get username from database
        const userResult = await db.send_sql(`
            SELECT username, image_url
            FROM users 
            WHERE user_id = ${user_id}`);

        // Check if user exists
        if (!userResult || userResult.length === 0) {
            res.status(400).json({error: 'User not found'});
            return;
        }

        const userImageUrl = userResult[0].image_url;

        // Extract bucket and key from the S3 imageUrl
        const imageUrlParts = userImageUrl.split("/");
        const bucket = "lemonpiebucket";
        const key = imageUrlParts[3];

        // Create S3 client params
        const params = {
            Bucket: bucket,
            Key: key,
        };
        
        // Get user image from S3 bucket - should be .jpg or similar format
        const s3Response = await s3Client.send(new GetObjectCommand(params));
        console.log(s3Response.Body);
        const userImage = s3Response.Body;

        // Check if image was retrieved
        if (!userImage) {
            res.status(400).json({error: 'User image not found'});
            return;
        }
        
        // Create collection of actor embeddings in Chroma 
        const collection = await client.getOrCreateCollection({
            name: "face-api",
            embeddingFunction: null,
            // L2 here is squared L2, not Euclidean distance
            metadata: { "hnsw:space": "l2" },
        });

        const promises = [];
        fs.readdir("images", function (err, files) {
            if (err) {
              console.error("Could not list the directory.", err);
              process.exit(1);
            }
            files.forEach(function (file, index) {
                promises.push(faceModule.indexAllFaces(path.join("images", file), file, collection));
            });
            Promise.all(promises)
            .catch((err) => {
            console.error("Error indexing images:", err);
            });
        });
    
        // Return top 5 most similar actors
        // Matches stores actor ID and image.jpg
        const matches = await faceModule.findTopKMatches(collection, userImage, 5);
        
        // Results array to store actor ID and converted image URL 
        // This loop will upload each of the images to S3 and then substitute the image name with the S3 URL
        const results = [];
        for (let match of matches) {
            for (let i = 0; i < match.documents.length; i++) {
                const actorImage = match.documents[i];
                const actorImageId = match.ids[i];
                const actorImagePath = path.join("path/to/actor/images", actorImage); // Make sure the path is correct

                // Read image file
                const fileBuffer = fs.readFileSync(actorImagePath);

                // Upload to S3
                const uploadParams = {
                    Bucket: 'lemonpiebucket', // Ensure this bucket exists
                    Key: `actor_images/${actorImage}`,
                    Body: fileBuffer,
                    ACL: 'public-read'
                };
                const imageData = await s3Client.upload(uploadParams).promise();
                const imageUrl = imageData.Location;

                results.push({ actorId: actorImageId, imageUrl: imageUrl });
            }
        }

        // Return JSON array with actor ID and image (in .jpg format)
        res.status(200).json(results);

    } catch (error) {
        console.error('Failed to get actor recommendations:', error);
        res.status(500).json({error: 'Failed to get actor recommendations'});
    }
}

// Based on user choice, link the account with the actor information
// Parameters stored in req.body: user_id, actor_id
var postLinkActor = async function(req, res) {
    const { actor_id } = req.body;

    try {
        // Insert the user_id and actor_id into the linked_actors table
        await db.send_sql(`
            INSERT INTO linked_actors (user_id, actor_id)
            VALUES (${req.session.user_id}, '${actor_id}')`);

        // Return success message
        res.json({success: 'Actor linked successfully'});

    } catch (error) {
        console.error('Failed to link actor:', error);
        res.status(500).json({error: 'Failed to link actor'});
    }
}

var getLinkActor = async function(req, res) {
    try {
        // Get the actor name linked to the user_id
        const result = await db.send_sql(`
            SELECT an.primaryName AS actor
            FROM linked_actors la
            JOIN actor_names an
            ON la.actor_id = an.nconst
            WHERE user_id = ${req.session.user_id}`);

        // Return actor name
        res.json(result);

    } catch (error) {
        console.error('Failed to get linked actor:', error);
        res.status(500).json({error: 'Failed to get linked actor'});
    }

}

var routes = {
    get_actor_recommendations: getActorRecommendations,
    post_link_actor: postLinkActor,
    get_link_actor: getLinkActor
  };


module.exports = routes;


