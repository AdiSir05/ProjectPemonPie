const user_routes = require('./user_routes.js');
const feed_routes = require('./feed_routes.js');
const actor_routes = require('./actor_routes.js');
const chat_routes = require('./chat_routes.js');
const search_routes = require('./search_routes.js');
const multer = require('multer');

const upload = multer({dest: './uploads'});

module.exports = {
    register_routes
}

function register_routes(app) {
    // user routes
    app.get('/get_user', user_routes.get_user);
    app.post('/register', user_routes.post_register);
    app.post('/login', user_routes.post_login);
    app.get('/:username/logout', user_routes.get_logout);
    app.post('/:username/update', user_routes.post_update_user);
    app.post('/:username/upload_image', upload.single('file'), user_routes.post_upload_image);
    app.get('/:username/profile', user_routes.get_user_profile);
    app.post('/get_follow_requests', user_routes.get_follow_requests);
    app.post('/get_friends', user_routes.get_friends);
    app.post('/:username/send_follow_request', user_routes.post_send_follow_request);
    app.post('/:username/accept_follow', user_routes.post_accept_follow);
    app.post('/:username/decline_follow', user_routes.post_decline_follow);
    app.post('/:username/unfollow', user_routes.post_unfollow);
    app.post('/:username/get_mutual_recommendations', user_routes.get_mutual_recommendations);
    app.post('/:username/get_interest_recommendations', user_routes.get_interest_recommendations);


    // feed routes
    app.post('/:username/post', feed_routes.post_create_post);
    app.get('/feed', feed_routes.get_feed);
    app.post('/:username/comment', feed_routes.post_comment);
    app.post('/:username/delete_comment', feed_routes.post_delete_comment);
    app.post('/:username/update_like', feed_routes.post_update_like);
    app.post('/:username/get_comments', feed_routes.get_comments);
    app.post('/:username/get_likes', feed_routes.get_likes);

    // actor routes
    app.post('/:username/actor_recommendations', actor_routes.get_actor_recommendations);
    app.post('/:username/link_actor', actor_routes.post_link_actor);
    app.post('/:username/get_linked_actor', actor_routes.get_link_actor);

    // chat routes
    app.post('/:username/invite_user', chat_routes.post_invite_user);
    app.post('/:username/accept_invite', chat_routes.post_accept_invite);
    app.post('/:username/decline_invite', chat_routes.post_decline_invite);
    app.get('/:username/invites', chat_routes.get_invites);
    app.post('/:username/create_chat', chat_routes.post_create_chat);
    app.post('/:username/leave_chat', chat_routes.post_leave_chat);
    app.post('/:username/delete_chat', chat_routes.post_delete_chat);
    app.post('/:username/chat_messages', chat_routes.get_chat_messages);
    app.post('/:username/send_message', chat_routes.post_send_message);
    app.post('/:username/get_chats', chat_routes.get_chats);

    // search routes
    app.post('/:username/search_people', search_routes.post_search_people);
    app.post('/:username/search_posts', search_routes.post_search_posts);
  }
  