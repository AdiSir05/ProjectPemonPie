const dbsingleton = require('../models/db_access.js');
const config = require('../config.json');
const helper = require('../routes/route_helper.js');
const { read } = require("fs");
const session = require("express-session");

// Database connection setup
const db = dbsingleton;

const PORT = config.serverPort;

// Given text and an image url, create a new post
// Parameters stored in req.body: text, image_url
var postCreatePost = async function(req, res) {
    var { text, interests, image_url } = req.body;
    // make sure both params are present
    if (!text || !image_url) {
        return res.status(400).json({ error: 'Image URL or text params missing from post.' });
    }

    try {
        // get the user_id from the session
        var user_id = req.session.user_id;

        // create date var in SQL DATE format for the current date
        var date = new Date();
        var sqlDate = date.toISOString().split('T')[0];
        // create time var in SQL TIME format for the current time
        var time = date.toTimeString().split(' ')[0];

        // insert the post to the 'posts' table
        await db.insert_items(`INSERT INTO posts (user_id, post_date, post_time, post_text, post_interests, image_url) VALUES (${user_id}, "${sqlDate}", "${time}", "${text}", "${interests}", "${image_url}")`);
        console.log("Post created successfully.");
        res.status(200).json({ message: 'Post created successfully.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying/inserting database during post.' });
    }
}

// // Get a post feed
// // If body contains a user_id field, get the posts for that user, otherwise get posts for the current user
// var getFeed = async function(req, res) {
//     var { user_id } = req.body;
//     // if user_id is not present, get the user_id from the session
//     if (user_id) {
//         try {
//             // get all the posts from the user with the given user_id
//             var posts = await db.send_sql(`SELECT p.image_url AS image_url, post_date, post_id, post_interests, post_text, post_time, p.user_id, u.username, u.image_url AS user_image_url FROM posts p JOIN users u ON p.user_id = u.user_id WHERE p.user_id = ${user_id} ORDER BY p.post_date DESC, p.post_time DESC`);
//             res.status(200).json({ user_id: user_id, posts: posts }); 
//         } catch (error) {
//             console.log(error);
//             res.status(500).json({ error: 'Error querying database for posts.' });
//         }
//     } else {
//         //  get the feed for the current user of all the people they follow
//         try {
//             // get the user_id from the session
//             var user_id = req.session.user_id;
//             // get all the posts from the people the user follows
//             var posts = await db.send_sql(`SELECT p.image_url AS image_url, post_date, post_id, post_interests, post_text, post_time, p.user_id, u.username, u.image_url AS user_image_url FROM posts p JOIN users u ON p.user_id = u.user_id WHERE p.user_id IN (SELECT followed FROM followers WHERE follower = ${user_id}) OR p.user_id = ${user_id} ORDER BY p.post_date DESC, p.post_time DESC LIMIT 20`);
//             res.status(200).json({ user_id: user_id, posts: posts });
//         } catch (error) {
//             console.log(error);
//             res.status(500).json({ error: 'Error querying database for feed.' });
//         }
//     }
// }


var getFeed = async function(req, res) {
    var { user_id } = req.body;
    // if user_id is not present, get the user_id from the session

    if (user_id) {
        try {
            // get all the posts from the user with the given user_id
            var posts = await db.send_sql(`SELECT p.image_url AS image_url, post_date, post_id, post_interests, post_text, post_time, p.user_id, u.username, u.image_url AS user_image_url FROM posts p JOIN users u ON p.user_id = u.user_id WHERE p.user_id = ${user_id} ORDER BY p.post_date DESC, p.post_time DESC`);
            res.status(200).json({ user_id: user_id, posts: posts }); 
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Error querying database for posts.' });
        }
    } else {
        //  get the feed for the current user of all the people they follow
        try {
            // get the user_id from the session
            var user_id = req.session.user_id;
            var posts = await db.send_sql(`SELECT p.image_url AS image_url, post_date, post_id, post_interests, post_text, post_time, p.user_id, u.username, u.image_url AS user_image_url FROM posts p JOIN users u ON p.user_id = u.user_id WHERE p.user_id IN (SELECT followed FROM followers WHERE follower = ${user_id}) OR p.user_id = ${user_id} ORDER BY p.post_date DESC, p.post_time DESC LIMIT 20`);
            // pull 20 posts from the kafkaPosts table randomly and add them to the feed. 
            var kafkaPosts = await db.send_sql(`SELECT * FROM kafkaPosts ORDER BY RAND() LIMIT 20`);
            // randomly merge kafkaPosts and posts, make sure the first 10 posts are from the posts table for the feed

            // i = the number of elements in posts
            var i = 0;
            var j = 0;
            var k = 0;
            var newPosts = [];
            while (i < 25 && j < 10 && k < 15) {
                if (i < 6 && j < posts.length) {
                    newPosts.push(posts[j]);
                    j++;
                } else if (Math.random() < 0.5 && j < posts.length) {
                    newPosts.push(posts[j]);
                    j++;
                } else {
                    newPosts.push(kafkaPosts[k]);
                    k++;
                }
                i++;
            }
            res.status(200).json({ user_id: user_id, posts: newPosts });
        } catch (error) {
            console.log(error);
            res.status(500).json({ error: 'Error querying database for feed.' });
        }
    }
}

// Post a comment on a post
// Parameters stored in req.body: text, post_id
var postComment = async function(req, res) {
    var { text, post_id } = req.body;
    // make sure both params are present
    if (!text || !post_id) {
        return res.status(400).json({ error: 'Text or post_id params missing from comment.' });
    }

    try {
        // get the user if from the session
        var user_id = req.session.user_id;
        // make usre post_id exists
        var post = await db.send_sql(`SELECT * FROM posts WHERE post_id = ${post_id}`);
        if (post.length == 0) {
            return res.status(400).json({ error: 'Post does not exist.' });
        }

        // get the last comment_id (the largest comment_id in the table)
        var newCommentId = await db.send_sql(`SELECT MAX(comment_id) FROM comments`);
        // if there are no comments, set the comment_id to 1
        if (newCommentId[0]['MAX(comment_id)'] == null) {
            newCommentId = 1;
        } else {
            newCommentId = newCommentId[0]['MAX(comment_id)'] + 1;
        }
        // get date and time for the comment
        var date = new Date();
        var sqlDate = date.toISOString().split('T')[0];
        var time = date.toTimeString().split(' ')[0];
        // add the comment to the 'comments' table
        await db.insert_items(`INSERT INTO comments (comment_id, post_id, user_id, comment_date, comment_time, comment_text) VALUES (${newCommentId}, ${post_id}, ${user_id}, "${sqlDate}", "${time}", "${text}")`);
        res.status(200).json({ message: 'Comment posted successfully.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying/inserting database during comment.' });
    }
}

// Delete a comment from a post
// Parameters stored in req.body: comment_id
// If the user is the author of the comment or the post, delete the comment
var postDeleteComment = async function(req, res) {
    var { comment_id } = req.body;
    // make sure comment_id is present
    if (!comment_id) {
        return res.status(400).json({ error: 'Comment_id param missing from delete comment.' });
    }

    try {  
        // get the user_id from the session
        var user_id = req.session.user_id;
        // get the comment from the 'comments' table
        var comment = await db.send_sql(`SELECT * FROM comments WHERE comment_id = ${comment_id}`);
        // make sure the comment exists
        if (comment.length == 0) {
            return res.status(400).json({ error: 'Comment does not exist.' });
        }
        // make sure the user is the author of the comment
        if (comment[0].user_id != user_id) {
            return res.status(400).json({ error: 'User is not the author of the comment.' });
        }
        // delete the comment from the 'comments' table
        await db.send_sql(`DELETE FROM comments WHERE comment_id = ${comment_id}`);
        res.status(200).json({ message: 'Comment deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error querying/deleting database during comment deletion.' });
    }
}

// Like a post
// Parameters stored in req.body: post_id
var updateLike = async function(req, res) {
    var { post_id } = req.body;
    // make sure post_id is present
    if (!post_id) {
        return res.status(400).json({ error: 'Post_id param missing from like post.' });
    }

    try {  
        // get the user_id from the session
        var user_id = req.session.user_id;
        // check to see if the post and user exist in the 'likes' table
        var like = await db.send_sql(`SELECT * FROM likes WHERE post_id = ${post_id} AND user_id = ${user_id}`);
        // if the like exists, delete it
        if (like.length != 0) {
            await db.send_sql(`DELETE FROM likes WHERE post_id = ${post_id} AND user_id = ${user_id}`);
            res.status(200).json({ message: 'Post unliked successfully.' });
        } else {
            // if the like does not exist, add it
            var newLikeId = await db.send_sql(`SELECT MAX(like_id) FROM likes`);
            if (newLikeId[0]['MAX(like_id)'] == null) {
                newLikeId = 1;
            } else {
                newLikeId = newLikeId[0]['MAX(like_id)'] + 1;
            }
            await db.insert_items(`INSERT INTO likes (like_id, post_id, user_id) VALUES (${newLikeId}, ${post_id}, ${user_id})`);
            res.status(200).json({ message: 'Post liked successfully.' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying/inserting/deleting likes database.' });
    }
}

// Get comments on a post
var getComments = async function(req, res) {
    var { post_id } = req.body;
    // make sure post_id is present
    if (!post_id) {
        return res.status(400).json({ error: 'Post_id param missing from get comments.' });
    }

    try {
        // get all the comments for the post with the given post_id
        var comments = await db.send_sql(`SELECT u.username, c.comment_text FROM comments c JOIN users u ON u.user_id=c.user_id WHERE post_id = ${post_id} ORDER BY comment_date DESC, comment_time DESC`);
        res.status(200).json({ post_id: post_id, comments: comments });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying database for comments.' });
    }
}

// Get whether or not a user has liked this post
var getLikes = async function(req, res) {
    var { post_id } = req.body;
    // make sure post_id is present
    if (!post_id) {
        return res.status(400).json({ error: 'Post_id param missing from get likes.' });
    }

    try {
        // get the user_id from the session
        var user_id = req.session.user_id;
        // check to see if the post and user exist in the 'likes' table
        var like = await db.send_sql(`SELECT * FROM likes WHERE post_id = ${post_id} AND user_id = ${user_id}`);
        // if the like exists, return true, otherwise return false
        if (like.length != 0) {
            res.status(200).json({ liked: true });
        } else {
            res.status(200).json({ liked: false });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying likes database.' });
    }
}



var routes = {
    post_create_post: postCreatePost,
    get_feed: getFeed,
    post_comment: postComment,
    post_delete_comment: postDeleteComment,
    post_update_like: updateLike,
    get_comments: getComments,
    get_likes: getLikes,
  };


module.exports = routes;

