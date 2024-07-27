const dbsingleton = require('../models/db_access.js');
const config = require('../config.json');
const helper = require('../routes/route_helper.js');
const { read } = require("fs");
const session = require("express-session");
const { get } = require('http');

// Database connection setup
const db = dbsingleton;

const PORT = config.serverPort;

// Invite a user
// Parameters stored in req.body: invited_username, chat_id
var postInviteUser = async function(req, res) {
    console.log("inviting");
    // make sure all params are present
    var { invited_username, chat_id } = req.body;
    if (!invited_username || !chat_id) {
        return res.status(400).json({ error: 'Invited username or chat id param missing from inviteUser.' });
    }

    try {
        // get the current user id
        var user_id = req.session.user_id;
        // get user_id of the invited user
        var invited_user_id = await db.send_sql(`SELECT * FROM users WHERE username = "${invited_username}"`);
        // if the invited user does not exist, return an error
        if (invited_user_id.length == 0) {
            return res.status(400).json({ error: 'Invited user does not exist.' });
        }
        // make sure that the chat exists
        var chat_exists = await db.send_sql(`SELECT chat_id FROM chats WHERE chat_id = ${chat_id}`);
        if (chat_exists.length == 0) {
            return res.status(400).json({ error: 'Chat does not exist.' });
        }

        // make sure the current user is a member of the chat
        var is_member = await db.send_sql(`SELECT is_member FROM chat_members WHERE user_id = ${user_id} AND chat_id = ${chat_id}`);
        // check if empty or if false
        if (is_member.length == 0 || is_member[0].is_member == false) {
            return res.status(400).json({ error: 'User is not a member of the chat.' });
        }

        // make sure the invited user is not already a member of the chat
        var is_member = await db.send_sql(`SELECT * FROM chat_members WHERE user_id = ${invited_user_id[0].user_id} AND chat_id = ${chat_id}`);
        if (is_member.length != 0) {
            return res.status(200).json({ message: 'User is already a member of the chat.' });
        }

        // insert the invited user into the chat_members table with is_member set to false
        await db.insert_items(`INSERT INTO chat_members (chat_id, user_id, is_member) VALUES (${chat_id}, ${invited_user_id[0].user_id}, false)`);
        res.status(200).json({ message: 'User invited successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error querying/inserting database during user invite.' });
    }
}

// Accept an invite
// Parameters stored in req.body: chat_id
var postAcceptInvite = async function(req, res) {
    // make sure chat_id is present
    var { chat_id } = req.body;
    if (!chat_id) {
        return res.status(400).json({ error: 'Chat id param missing from acceptInvite.' });
    }

    try {   
        // get the current user id
        var user_id = req.session.user_id;
        // make sure the chat exists
        var chat_exists = await db.send_sql(`SELECT chat_id FROM chats WHERE chat_id = ${chat_id}`);
        if (chat_exists.length == 0) {
            return res.status(400).json({ error: 'Chat does not exist.' });
        }
        // make sure the user is not already a member of the chat
        var is_member = await db.send_sql(`SELECT * FROM chat_members WHERE user_id = ${user_id} AND chat_id = ${chat_id}`);
        if (is_member[0].is_member == true) {
            return res.status(200).json({ message: 'User is already a member of the chat.' });
        }
        // set is_member to true
        await db.send_sql(`UPDATE chat_members SET is_member = true WHERE user_id = ${user_id} AND chat_id = ${chat_id}`);
        res.status(200).json({ message: 'User accepted invite successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error querying/inserting database during user invite acceptance.' });
    }
}

// Decline an invite
// Parameters stored in req.body: chat_id
var postDeclineInvite = async function(req, res) {
    // make sure chat_id is present
    var { chat_id } = req.body;
    if (!chat_id) {
        return res.status(400).json({ error: 'Chat id param missing from declineInvite.' });
    }

    try {
        // get the current user id
        var user_id = req.session.user_id;
        // make sure the chat exists
        var chat_exists = await db.send_sql(`SELECT chat_id FROM chats WHERE chat_id = ${chat_id}`);
        if (chat_exists.length == 0) {
            return res.status(400).json({ error: 'Chat does not exist.' });
        }
        // make sure the user has an invite to the chat
        var is_member = await db.send_sql(`SELECT * FROM chat_members WHERE user_id = ${user_id} AND chat_id = ${chat_id}`);
        if (is_member.length == 0) {
            return res.status(400).json({ message: 'User does not have an invite to the chat.' });
        }
        // see if user is already a member of the chat
        if (is_member[0].is_member == true) {
            return res.status(400).json({ message: 'User is already a member of the chat.' });
        }
        // delete the invite
        await db.send_sql(`DELETE FROM chat_members WHERE user_id = ${user_id} AND chat_id = ${chat_id}`);
        res.status(200).json({ message: 'User declined invite successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error querying/inserting database during user invite decline.' });
    }
}

// Get invites
// Parameters stored in req.body: NA
var getInvites = async function(req, res) {
    try {   
        // get user_id
        var user_id = req.session.user_id;
        // get all chat_id and chat_name where user_id is a member of the chat but is_member is false
        var invites = await db.send_sql(`SELECT chat_id, chat_name FROM chats WHERE chat_id IN (SELECT chat_id FROM chat_members WHERE user_id = ${user_id} AND is_member = false)`);
        res.status(200).json({ invites: invites });
    } catch (error) {
        res.status(500).json({ error: 'Error querying database during invite retrieval.' });
    }
}

// Create a chat
// Parameters stored in req.body: chat_name
var postCreateChat = async function(req, res) {
    // make sure chat_name is present
    var { chat_name } = req.body;
    if (!chat_name) {
        return res.status(400).json({ error: 'Chat name param missing from post.' });
    }

    try {
        // get the current user id
        var user_id = req.session.user_id;
        // find the last chat id (the largest chat_id in the table)
        var newChatId = await db.send_sql(`SELECT MAX(chat_id) FROM chats`);
        // if there are no chats, set the chat_id to 1
        if (newChatId[0]['MAX(chat_id)'] == null) {
            newChatId = 1;
        } else {
            newChatId = newChatId[0]['MAX(chat_id)'] + 1;
        }

        // insert the chat to the 'chats' table
        await db.insert_items(`INSERT INTO chats (chat_id, chat_name) VALUES (${newChatId}, "${chat_name}")`);
        // add the user and chat to the 'chat_members' table, set is_member to true
        await db.insert_items(`INSERT INTO chat_members (chat_id, user_id, is_member) VALUES (${newChatId}, ${user_id}, true)`);
        res.status(200).json({ message: 'Chat created successfully.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying/inserting database during chat creation.' });
    }
}

// Leave a chat
// Parameters stored in req.body: chat_id
var postLeaveChat = async function(req, res) {
    // make sure chat_id is present
    var { chat_id } = req.body;
    if (!chat_id) {
        return res.status(400).json({ error: 'Chat id param missing from leaveChat.' });
    }

    try {
        // get user_id
        var user_id = req.session.user_id;
        // make sure the chat exists
        var chat_exists = await db.send_sql(`SELECT chat_id FROM chats WHERE chat_id = ${chat_id}`);
        if (chat_exists.length == 0) {
            return res.status(400).json({ error: 'Chat does not exist.' });
        }
        // make sure the user is a member of the chat
        var is_member = await db.send_sql(`SELECT * FROM chat_members WHERE user_id = ${user_id} AND chat_id = ${chat_id}`);
        if (is_member.length == 0 || is_member[0].is_member == false) {
            return res.status(400).json({ error: 'User is not a member of the chat.' });
        }
        // delete the user from the chat
        await db.send_sql(`DELETE FROM chat_members WHERE user_id = ${user_id} AND chat_id = ${chat_id}`);
        res.status(200).json({ message: 'User left chat successfully.' });
    } catch (error) {   
        res.status(500).json({ error: 'Error querying/inserting database during user chat leave.' });
    }
}

// Delete a chat
// Parameters stored in req.body: chat_id
var postDeleteChat = async function(req, res) {
    var { chat_id } = req.body;
    if (!chat_id) {
        return res.status(400).json({ error: 'Chat id param missing from deleteChat.' });
    }
    try {
        // get user_id
        var user_id = req.session.user_id;
        // make sure the chat exists
        var chat_exists = await db.send_sql(`SELECT chat_id FROM chats WHERE chat_id = ${chat_id}`);
        if (chat_exists.length == 0) {
            return res.status(400).json({ error: 'Chat does not exist.' });
        }
        // make sure the user is a member of the chat
        var is_member = await db.send_sql(`SELECT * FROM chat_members WHERE user_id = ${user_id} AND chat_id = ${chat_id}`);
        if (is_member.length == 0 || is_member[0].is_member == false) {
            return res.status(400).json({ error: 'User is not a member of the chat.' });
        }
        // delete the chat
        await db.send_sql(`DELETE FROM chats WHERE chat_id = ${chat_id}`);
        //delete all chat members
        await db.send_sql(`DELETE FROM chat_members WHERE chat_id = ${chat_id}`);
        res.status(200).json({ message: 'Chat deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error querying/inserting database during chat deletion.' });
    }
}

// Get chat messages (username, message_text, message_date, message_time)
// Parameters stored in req.body: chat_id
var getChatMessages = async function(req, res) {
    // make sure chat_id is present
    var { chat_id } = req.body;
    if (!chat_id) {
        return res.status(400).json({ error: 'Chat id param missing from getChatMessages.' });
    }

    try {
        // make sure the chat exists
        var chat_exists = await db.send_sql(`SELECT chat_id FROM chats WHERE chat_id = ${chat_id}`);
        if (chat_exists.length == 0) {
            return res.status(400).json({ error: 'Chat does not exist.' });
        }
        const user_id = req.session.user_id;
        // make sure the user is a member of the chat
        var is_member = await db.send_sql(`SELECT * FROM chat_members WHERE user_id = ${user_id} AND chat_id = ${chat_id} AND is_member = true`);
        if (is_member.length == 0) {
            return res.status(400).json({ error: 'User is not a member of the chat.' });
        }
        // get all messages from the chat (username from users and message_text, message_date, message_time from messages)
        var messages = await db.send_sql(`SELECT username, message_text, message_date, message_time FROM users JOIN messages ON users.user_id = messages.user_id WHERE chat_id = ${chat_id}`);
        res.status(200).json({ messages: messages });
    } catch (error) {
        res.status(500).json({ error: 'Error querying database during chat message retrieval.' });
    }
}

// Send a message
// Parameters stored in req.body: chat_id, message
var postSendMessage = async function(req, res) {
    // make sure chat_id and message are present
    var { chat_id, message } = req.body;
    if (!chat_id || !message) {
        return res.status(400).json({ error: 'Chat id or message param missing from sendMessage.' });
    }

    try {
        // get user_id
        var user_id = req.session.user_id;
        // make sure the chat exists
        var chat_exists = await db.send_sql(`SELECT chat_id FROM chats WHERE chat_id = ${chat_id}`);
        if (chat_exists.length == 0) {
            return res.status(400).json({ error: 'Chat does not exist.' });
        }
        // make sure the user is a member of the chat
        var is_member = await db.send_sql(`SELECT * FROM chat_members WHERE user_id = ${user_id} AND chat_id = ${chat_id}`);
        if (is_member.length == 0 || is_member[0].is_member == false) {
            return res.status(400).json({ error: 'User is not a member of the chat.' });
        }
        // get the current date and time
        var date = new Date();
        var message_date = date.toISOString().split('T')[0];
        var message_time = date.toTimeString().split(' ')[0];
        // get new message id
        var newMessageId = await db.send_sql(`SELECT MAX(message_id) FROM messages`);
        if (newMessageId[0]['MAX(message_id)'] == null) {
            newMessageId = 1;
        } else {
            newMessageId = newMessageId[0]['MAX(message_id)'] + 1;
        }
        // insert the message into the 'messages' table
        await db.insert_items(`INSERT INTO messages (message_id, chat_id, user_id, message_date, message_time, message_text) VALUES (${newMessageId}, ${chat_id}, ${user_id}, "${message_date}", "${message_time}", "${message}")`);
        res.status(200).json({ message: 'Message sent successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error querying/inserting database during message send.' });
    }
}

// Get chats that the current user is a member of
// Parameters stored in req.body: NA
var getChats = async function(req, res) {
    try {
        // get user_id
        var user_id = req.session.user_id;
        // get all chat_id and chat_name where user_id is a member of the chat
        var chats = await db.send_sql(`SELECT chats.chat_id, chat_name, is_member FROM chat_members JOIN chats ON chats.chat_id=chat_members.chat_id WHERE user_id = ${user_id}`);
        res.status(200).json({ chats: chats });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error querying database during chat retrieval.' });
    }
}



var routes = {
    post_invite_user: postInviteUser,
    post_accept_invite: postAcceptInvite,
    post_decline_invite: postDeclineInvite,
    get_invites: getInvites,
    post_create_chat: postCreateChat,
    post_leave_chat: postLeaveChat,
    post_delete_chat: postDeleteChat,
    get_chat_messages: getChatMessages,
    post_send_message: postSendMessage,
    get_chats: getChats
  };


module.exports = routes;

