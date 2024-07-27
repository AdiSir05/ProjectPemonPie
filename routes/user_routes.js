const dbsingleton = require('../models/db_access.js');
const config = require('../config.json');
const bcrypt = require('bcrypt'); 
const helper = require('../routes/route_helper.js');
const fs = require("fs");
const session = require("express-session");
const { fromIni } = require("@aws-sdk/credential-provider-ini");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// Database connection setup
const db = dbsingleton;

const PORT = config.serverPort;

require('dotenv').config();

const credentials = fromIni({
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    sessionToken: process.env.SESSION_TOKEN
});

// Initialize the S3 client with your region
const s3Client = new S3Client({region: "us-east-1", credentials: credentials });

// Get the current user
var getUser = async function(req, res) {
    return res.status(200).json({username: req.session.username, user_id: req.session.user_id});
}

// Given a username, password, first name, last name, email, register a new user
// Parameters stored in req.body
var postRegister = async function(req, res) {
    var {username, password, first_name, last_name, email } = req.body;
    
    // Check for missing parameters
    if (!username ||  !password || !first_name || !last_name || !email) {
        console.log('One or more of the fields you entered was empty, please try again.');
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    }

    // Check that username is valid
    if (!helper.isOK(username)) {
        console.log('Invalid username.');
        return res.status(400).json({ error: 'Invalid username.' });
    }

    try { 
        // Check if user exists 
        var userExists = await db.send_sql(`SELECT * FROM users WHERE username = "${username}"`);
        if (userExists.length > 0) {
            console.log('An account with this username already exists, please try again.');
            return res.status(409).json({ error: 'An account with this username already exists, please try again.' });
        }

        helper.encryptPassword(password, async function(err, hash) {
            try {
                const query = `INSERT INTO users (username, hashed_password, first_name, last_name, email, image_url) VALUES ("${username}", "${hash}", "${first_name}", "${last_name}", "${email}", "https://lemonpiebucket.s3.us-east-1.amazonaws.com/lemon.jpg")`;
                await db.insert_items(query);
                const query2 = `SELECT user_id FROM users WHERE username = "${username}"`;
                const user_id = await db.send_sql(query2);
                req.session.username = username;
                req.session.user_id = user_id;
                return res.status(200).json({message: `{username: '${username}'}`});
            } catch (err) {
                console.log('Error querying database1.');
                console.log('Error: ' + err);
                return res.status(500).json({error: 'Error querying database.'});
            }
        });

    } catch (error) {
        console.log('Error querying database2.');
        console.log('Error: ' + error);
        return res.status(500).json({ error: 'Error querying database.' });
    }
}

// Given a username and a password, login to the system
// Parameters stored in req.body
var postLogin = async function(req, res) {
    const { username, password } = req.body;

    console.log("Login called");

    // Check for missing parameters
    if (!username || !password) {
        return res.status(400).json({ error: 'One or more of the fields you entered was empty, please try again.' });
    } 

    try {
        // Retrieve user data
        const userData = await db.send_sql(`SELECT * FROM users WHERE username = "${username}"`);

        // Check if user exists
        if (userData.length === 0) {
            console.log("User does not exist");
            return res.status(401).json({ error: 'Username and/or password are invalid.' });
        } 

        // Compare password with stored hash using bcrypt
        bcrypt.compare(password, userData[0].hashed_password, (err, result) => {
            if (err) throw err;

            if (result) {
                // Successful login, store user_id in session
                req.session.user_id = userData[0].user_id;
                req.session.username = username;
                res.status(200).json({ username: username });
                console.log("Login successful");
            } else {
                res.status(401).json({ error: 'Username and/or password are invalid.' });
                console.log("Username and/or password are invalid.");
            }
        });
    } catch (error) {
        console.log("error querying database");
        res.status(500).json({ error: 'Error querying database.' });
    }
}

// Log out of the system, clearing username and user_id from the current session
// No parameters
var getLogout = async function(req, res) {
    // Clear username and user_id from the session
    req.session.username = null;
    req.session.user_id = null;
    res.status(200).json({ message: 'You were successfully logged out.' });
}

// Update user data
// Check req.body for each of the following fields: first_name, last_name, affiliation, email, birth_date, interests, bio
// Change the user's data in the database if the field is present
var postUpdateUser = async function(req, res) {

    var {user_id, first_name, last_name, affiliation, email, birth_date, interests, bio, image_url } = req.body;

    console.log(req.body);
    
    // Check req.body for each of the following fields: first_name, last_name, affiliation, email, birth_date, interests, bio and update user's data in the database if the field is present
    // Loop through and check for missing parameters
    try {
        updateQuery = `UPDATE users SET `;

        if (first_name) {
            updateQuery += `first_name = "${first_name}", `;
        }
        if (last_name) {
            updateQuery += `last_name = "${last_name}", `;
        }
        if (affiliation) {
            updateQuery += `affiliation = "${affiliation}", `;
        }
        if (email) {
            updateQuery += `email = "${email}", `;
        }
        if (birth_date) {
            updateQuery += `birth_date = "${birth_date.split('T')[0]}", `;
        }
        if (interests) {
            updateQuery += `interests = "${interests}", `;
        }
        if (bio) {
            updateQuery += `bio = "${bio}", `;
        }
        if (image_url) {
            updateQuery += `image_url = "${image_url}", `;
        }

        // Remove the trailing comma and space
        updateQuery = updateQuery.slice(0, -2);
        // var userId = req.params.userId;
        updateQuery += ` WHERE user_id = "${user_id}"`;

        console.log(updateQuery);

        // Update the user's data in the database
        await db.send_sql(updateQuery);
        
        res.status(200).json({ message: 'User data updated successfully.' });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying database.' });
    }
}

// Upload an image to the S3 server, return the URL
var postUploadImage = async function(req, res) {
    console.log("Upload Image Called");
    const username = req.params.username;

    // Check for missing parameters
    if (!req.file) {
        return res.status(400).json({ error: 'No image was provided.' });
    }

    try {
        const fileStream = fs.createReadStream(req.file.path);
        // Upload image to S3 server
        const params = {
            Bucket: 'lemonpiebucket',
            Key: `${username}_${req.file.filename}`,
            Body: fileStream,
            ACL: 'public-read'
        };

        await s3Client.send(new PutObjectCommand(params));
        const imageUrl = `https://${params.Bucket}.s3.us-east-1.amazonaws.com/${params.Key}`;

        console.log(imageUrl);

        res.status(200).json({url: imageUrl});
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error uploading image.' });
    }
}

// Get a user's profile
// Parameters stored in req.body: username
var getUserProfile = async function(req, res) {
    const username = req.params.username;

    try {
        // Check for missing parameters
        if (!username) {
            console.log('No username was provided.');
            return res.status(400).json({ error: 'No username was provided.' });
        }

        // Retrieve user data
        const userData = await db.send_sql(`SELECT * FROM users WHERE username = "${username}"`);

        // Check if user exists
        if (userData.length === 0) {
            console.log('User not found.');
            return res.status(404).json({ error: 'User not found.' });
        }

        res.status(200).json({ user: userData[0] });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying database.' });
    }
}

// Check for a follow request
var getFollowRequest = async function(req, res) {
    const friend_username = req.body.friend_name;
    const cur_username = req.body.cur_username;
    try {
        if (friend_username) {
            // Check if friend_username exists
            const friendData = await db.send_sql(`SELECT * FROM users WHERE username = "${friend_username}"`);
            if (friendData.length === 0) {
                return res.status(404).json({ error: 'User not found.' });
            }
            const friend_id = friendData[0].user_id;

            // Check if cur_username exists
            const curData = await db.send_sql(`SELECT * FROM users WHERE username = "${cur_username}"`);
            if (curData.length === 0) {
                return res.status(404).json({ error: 'User not found.' });
            }
            const cur_id = curData[0].user_id;

            // Check if follow request already exists
            const followRequest = await db.send_sql(`SELECT * FROM followers WHERE follower = ${cur_id} AND followed = ${friend_id}`);
            if (followRequest.length > 0) {
                const following = followRequest[0].accepted == 1;
                return res.status(200).json({ requested: true, following: following});
            } else {
                return res.status(200).json({ requested: false, following: false });
            }
        } else {
            const curData = await db.send_sql(`SELECT * FROM users WHERE username = "${cur_username}"`);
            if (curData.length === 0) {
                return res.status(404).json({ error: 'User not found.' });
            }
            const cur_id = curData[0].user_id;

            const followRequests = await db.send_sql(`SELECT u.username, u.first_name, u.last_name, u.image_url FROM followers f JOIN users u ON f.follower = u.user_id WHERE followed = ${cur_id} AND accepted = 0`);
            if (followRequests.length > 0) {
                return res.status(200).json({ requests: followRequests });
            } else {
                return res.status(200).json({ requests: [] });
            }
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying database.' });
    }

}

// Get all friends of current user
var getFriends = async function (req, res) {
    const user_id = req.session.user_id;
    try {
        const friends = await db.send_sql(`SELECT u.username, u.first_name, u.last_name, u.image_url FROM followers f JOIN users u ON f.followed = u.user_id WHERE f.follower = ${user_id} AND f.accepted = 1`);
        res.status(200).json({ friends: friends });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying database.' });
    }
}


// Send a follow request
// Parameters stored in req.body: friend_username
var postSendFollowRequest = async function(req, res) {
    const friend_username = req.body.friend_name;
    
    try {
        // Check if friend_username exists
        const friendData = await db.send_sql(`SELECT * FROM users WHERE username = "${friend_username}"`);
        if (friendData.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const friend_id = friendData[0].user_id;

        // Check if follow request already exists
        const followRequest = await db.send_sql(`SELECT * FROM followers WHERE follower = ${req.session.user_id} AND followed = ${friend_id}`);
        if (followRequest.length > 0) {
            return res.status(409).json({ error: 'Friend request already exists.' });
        }

        // Send follow request
        await db.insert_items(`INSERT INTO followers (followed, follower, accepted) VALUES (${friend_id}, ${req.session.user_id}, false)`);
        res.status(200).json({ message: 'Friend request sent.' });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying database.' });
    }
} 

// Accept a friend request
// Parameters stored in req.body: friend_id
var postAcceptFollow = async function(req, res) {
    const friend_username = req.body.friend_name;

    try {
        // Check if friend_id exists
        const friendData = await db.send_sql(`SELECT * FROM users WHERE username = "${friend_username}"`);
        if (friendData.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const friend_id = friendData[0].user_id;

        // Check if follow request exists
        const followRequest = await db.send_sql(`SELECT * FROM followers WHERE follower = ${friend_id} AND followed = ${req.session.user_id}`);
        if (followRequest.length === 0) {
            return res.status(404).json({ error: 'Follow request not found.' });
        }

        // Accept follow request
        query = `UPDATE followers SET accepted = true WHERE followed = ${req.session.user_id} AND follower = ${friend_id}`;
        await db.insert_items(query);
        res.status(200).json({ message: 'Friend request accepted.' });

    } catch (error) {
        res.status(500).json({ error: 'Error querying database.' });
    }
}

// Decline a friend request
// Parameters stored in req.body: friend_id
var postDeclineFollow = async function(req, res) {
    const friend_username = req.body.friend_name;

    try {
        // Check if friend_id exists
        const friendData = await db.send_sql(`SELECT * FROM users WHERE username = "${friend_username}"`);
        if (friendData.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const friend_id = friendData[0].user_id;

        // Check if follow request exists
        const followRequest = await db.send_sql(`SELECT * FROM followers WHERE follower = ${friend_id} AND followed = ${req.session.user_id}`);
        if (followRequest.length === 0) {
            return res.status(404).json({ error: 'Follow request not found.' });
        }

        // Decline friend request
        await db.send_sql(`DELETE FROM followers WHERE follower = ${friend_id} AND followed = ${req.session.user_id}`);
        res.status(200).json({ message: 'Friend request declined.' });
    
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying database.' });
    }
}

var postUnfollow = async function(req, res) {
    const friend_username = req.body.friend_name;

    try {
        // Check if friend_id exists
        const friendData = await db.send_sql(`SELECT * FROM users WHERE username = "${friend_username}"`);
        if (friendData.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const friend_id = friendData[0].user_id;

        // Check if follow request exists
        const followRequest = await db.send_sql(`SELECT * FROM followers WHERE followed = ${friend_id} AND follower = ${req.session.user_id}`);
        if (followRequest.length === 0) {
            return res.status(404).json({ error: 'Follow request not found.' });
        }

        // Decline friend request
        await db.send_sql(`DELETE FROM followers WHERE followed = ${friend_id} AND follower = ${req.session.user_id}`);
        res.status(200).json({ message: 'Friend request declined.' });
    
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying database.' });
    }
}

var get_mutual_recommendations = async function(req, res) {
    const user_id = req.session.user_id;
    try {
        const query = `SELECT u.username, u.first_name, u.last_name, u.image_url FROM followers f1 JOIN followers f2 ON f1.followed = f2.follower JOIN users u ON f2.followed = u.user_id WHERE f1.follower = ${user_id} AND f1.accepted = 1 AND f2.accepted = 1 AND f2.followed != ${user_id} AND f2.followed NOT IN (SELECT followed FROM followers WHERE follower = ${user_id})`;
        const mutual_recommendations = await db.send_sql(query);
        res.status(200).json({ recommendations: mutual_recommendations });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying database.' });
    }
}

var get_interest_recommendations = async function(req, res) {
    const user_id = req.session.user_id;
    try {
        const user_interests = await db.send_sql(`SELECT interests FROM users WHERE user_id = ${user_id}`);
        if (!user_interests[0].interests) {
            return res.status(200).json({ recommendations: [] });
        }
        const user_interest_array = user_interests[0].interests.split(',').map(i => i.trim());
        var interest_recommendations = [];

        for (const interest of user_interest_array) {
            const usersWithInterest = await db.send_sql(`SELECT username, first_name, last_name, image_url, interests FROM users WHERE interests LIKE '%${interest}%' AND user_id != ${user_id} AND user_id NOT IN (SELECT followed FROM followers WHERE follower = ${user_id})` );
            for (const user of usersWithInterest) {
                // const overlapCount = user.interests.split(',').map(i => i.trim()).filter(i => user_interest_array.includes(i)).length;
                const overlapCount = 1;
                interest_recommendations.push({ user, overlapCount });
            }
        }
        // Reduce interest_recommendations by user
        interest_recommendations = interest_recommendations.reduce((acc, curr) => {
            console.log(acc);
            const existingUser = acc.find(user => user.user.username === curr.user.username);
            if (existingUser) {
            existingUser.overlapCount += curr.overlapCount;
            } else {
            acc.push(curr);
            }
            return acc;
        }, []);

        interest_recommendations.sort((a, b) => b.overlapCount - a.overlapCount);
        const topRecommendations = interest_recommendations.map(item => item.user);
        console.log(topRecommendations);
        res.status(200).json({ recommendations: topRecommendations });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying database.' });
    }

}

var user_routes = {
    get_user: getUser,
    post_login: postLogin,
    post_register: postRegister,
    get_logout: getLogout,
    post_update_user: postUpdateUser,
    post_upload_image: postUploadImage,
    get_user_profile: getUserProfile,
    get_follow_requests: getFollowRequest,
    get_friends: getFriends,
    post_send_follow_request: postSendFollowRequest,
    post_accept_follow: postAcceptFollow, 
    post_decline_follow: postDeclineFollow,
    post_unfollow: postUnfollow,
    get_mutual_recommendations: get_mutual_recommendations,
    get_interest_recommendations: get_interest_recommendations
  };


module.exports = user_routes;

