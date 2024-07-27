///////////////
// NETS 2120 Sample Kafka Client
///////////////

const express = require('express');
const { Kafka } = require('kafkajs');
const {  CompressionTypes, CompressionCodecs } = require('kafkajs')
const SnappyCodec = require('kafkajs-snappy')
const Ajv = require('ajv');
 
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec

const config = require('../config.json');

const app = express();
const kafka = new Kafka({
    clientId: 'my-app',
    brokers: config.bootstrapServers
});

const dbsingleton = require('../models/db_access.js');
const db = dbsingleton;

const consumer = kafka.consumer({ 
    groupId: config.groupId, 
    bootstrapServers: config.bootstrapServers});

const producer = kafka.producer();

const kafka_tweets = []; // Array to store parsed tweets

app.get('/', (req, res) => {
    res.send(JSON.stringify(kafka_tweets));
});

const produceToFederatedPosts = async (post) => {
    try {
        await producer.connect();
        await producer.send({
            topic: 'FederatedPosts',
            messages: [{ value: JSON.stringify(post) }],
        });
        console.log('Produced post to FederatedPosts:', post);
    } catch (error) {
        console.error('Error producing post to FederatedPosts:', error);
    }
};


// check kafkaUsers table to see if user is in it
// if doesn't exist, first create a new user in kafkaUsers
// extract the user ID from the kafkaUsers table 
// insert into regular posts table with the user ID and post information 

// kafkaUsers table schema
//  user_id VARCHAR(255), \
// kafka_id TEXT, \
// kafka_group TEXT, \
// PRIMARY KEY (user_id), \
// FOREIGN KEY (user_id) REFERENCES users(user_id) \

// var q1 = db.create_tables('CREATE TABLE IF NOT EXISTS users ( \
//     user_id INT NOT NULL AUTO_INCREMENT, \
//     username VARCHAR(255), \
//     hashed_password VARCHAR(255), \
//     first_name VARCHAR(255), \
//     last_name VARCHAR(255), \
//     affiliation VARCHAR(255), \
//     email VARCHAR(255), \
//     birth_date DATE, \
//     interests TEXT, \
//     bio TEXT, \
//     image_url VARCHAR(255), \
//     PRIMARY KEY (user_id) \
//     )');
    
//   var q2 = db.create_tables('CREATE TABLE IF NOT EXISTS posts ( \
//     post_id INT NOT NULL AUTO_INCREMENT, \
//     user_id INT, \
//     post_date DATE, \
//     post_time TIME, \
//     post_text TEXT, \
//     post_interests TEXT, \
//     image_url VARCHAR(255), \
//     PRIMARY KEY (post_id), \
//     FOREIGN KEY (user_id) REFERENCES users(user_id) \
//     )');

// twitter json schema
// {"quoted_tweet_id":null,
// "hashtags":["TBT”],
// "created_at":1712847606000,
// "replied_to_tweet_id":null,
// "quotes":0,
// "urls":"https://imdb.to/3xwOGF2”,
// "replies":32,
// "conversation_id":1778437876872581271,
// "mentions":[],
// "id":1778437876872581271,
// "text":"Still plenty of time for a 🌸 spring fling 🌸, just saying. #TBT https://t.co/gaXU3uJb8V https://t.co/lIvzJnlQBh”,
// "author_id":17602896,
// "retweets":80,
// "retweet_id":null,
// "likes":174}

const topic1 = "Twitter-Kafka";
const topic2 = "FederatedPosts";

async function handleTwitter(data) {
    // Check if user is in kafkaUsers table
    // If not, create a new user in kafkaUsers
    // Extract the user ID from the kafkaUsers table
    // Insert into regular posts table with the user ID and post information
    // define the kafka_group for twitter
    const twitter_group = 'twitter';
    try {
        const text = data.text;
        
        if (!text) {
            console.error('Invalid tweet:', data);
            return;
        }
        // check if 'author_id' is in the kafkaUsers table
        const kafka_id = data.author_id.toString();
        const username = 'twitter';
        // set password to a random number string. 
        const password = Math.floor(Math.random() * 1000000000).toString();
        var user_id;
        // query the database to see if the user is in the kafkaUsers table
        const user = await db.send_sql(`SELECT * FROM kafkaUsers WHERE kafka_id = ${kafka_id} AND kafka_group = ${twitter_group}`);
        // if the user is not in the kafkaUsers table, insert them
        if (user.length == 0) {
            // insert the kafka user into the users table
            var query = `INSERT INTO users (username, hashed_password) VALUES ('${username}', '${password}')`;
            await db.send_sql(query);
            // get the last inserted user_id (max)
            user_id = await db.send_sql(`SELECT MAX(user_id) FROM users`);
            // insert the kafka user into the kafkaUsers table
            query = `INSERT INTO kafkaUsers (user_id, kafka_id, kafka_group) VALUES (${user_id}, ${kafka_id}, ${twitter_group})`;
            await db.send_sql(query);
        } else {
            user_id = user[0].user_id;
        }

        // get current date and time
        const date = new Date();
        const post_date = date.toISOString().split('T')[0];
        const post_time = date.toISOString().split('T')[1].split('.')[0];
        // get the text from the tweet
        // get the hashtags from the tweet - convert to comma separated string
        const interests = data.hashtags.join(',');
        // insert the tweet into the posts table
        var query = `INSERT INTO posts (user_id, post_date, post_time, post_text, post_interests) VALUES (${user_id}, '${post_date}', '${post_time}', '${text}', '${interests}')`;
        await db.send_sql(query);
    } catch (error) {
        console.error('Error processing Twitter message:', error);
    }
}

async function handleFederated(data) {
    const federated_schema = {
        "type": "object",
        "properties": {
          "username": {"type": "string"},
          "source_site": {"type": "string"},
          "post_uuid_within_site": {"type": "string"},
          "post_text": {"type": "string"},
          "content_type": {"type": "string"},
          "attach": {
            "type": "string",
            "format": "uri",
          }
        },
        "required": ["username", "source_site", "post_uuid_within_site", "post_text", "content_type"]
    };
    try {
        // make sure the data is in the correct format
        const ajv = new Ajv();
        const validate = ajv.validate(federated_schema);
        if (!validate) {
            return;
        }
        // get the kafka_id from the federated post
        const kafka_id = data.post_uuid_within_site;
        // get the kafka_group as the source_site
        const kafka_group = data.source_site;
        // check to see if the user is in the kafkaUsers table
        const user = await db.send_sql(`SELECT * FROM kafkaUsers WHERE kafka_id = ${kafka_id} AND kafka_group = ${kafka_group}`);
        var user_id;
        // if the user is not in the kafkaUsers table, insert them
        if (user.length == 0) {
            // insert the kafka user into the users table
            var query = `INSERT INTO users (username, hashed_password) VALUES ('${data.username}', '${password}')`;
            await db.send_sql(query);
            // get the last inserted user_id (max)
            user_id = await db.send_sql(`SELECT MAX(user_id) FROM users`);
            // insert the kafka user into the kafkaUsers table
            query = `INSERT INTO kafkaUsers (user_id, kafka_id, kafka_group) VALUES (${user_id}, ${kafka_id}, ${kafka_group})`;
            await db.send_sql(query);
        } else {
            user_id = user[0].user_id;
        }
        // get current date and time
        const date = new Date();
        const post_date = date.toISOString().split('T')[0];
        const post_time = date.toISOString().split('T')[1].split('.')[0];
        // get the text from the federated post
        const text = data.post_text;
        // see if the federated post has an image
        var image_url;
        if (data.attach !== undefined) {
            image_url = data.attach;
          } else {
            image_url = '';
          }
        // insert the federated post into the posts table
        var query = `INSERT INTO posts (user_id, post_date, post_time, post_text, image_url) VALUES (${user_id}, '${post_date}', '${post_time}', '${text}', '${image_url}')`;
        await db.send_sql(query);
    } catch (error) {
        console.error('Error processing Federated message:', error);
    }
}

async function run () {
    try {
        console.log('Database successfully connected.');
        await consumer.connect();
        await consumer.subscribe({ topics: [topic1, topic2], fromBeginning: true });
        console.log('Kafka consumer connected and subscribed.');

        consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const data = JSON.parse(message.value.toString());
                    if (topic === topic1) {
                        // console.log('Processing Twitter post:', data);
                        await handleTwitter(data);
                        // kafka_tweets.push(data);
                    } else if (topic === topic2) {
                        // console.log('Processing Federated post:', data);
                        await handleFederated(data);
                    }
                    kafka_tweets.push(data);
                    await consumer.commitOffsets([{ topic, partition, offset: message.offset }]);
                } catch (err) {
                    console.error('Error processing message:', err);
                }
            }
        });

        // Produce federated post (sample)
        const sampleFederatedPost = {
            username: 'bobhope',
            source_site: 'g01',
            post_uuid_within_site: '40',
            post_text: 'A <b>bold</b> post',
            content_type: 'text/html'
        };
        await produceToFederatedPosts(sampleFederatedPost);

    } catch (error) {
        console.error('Error during startup:', error);
    }
}

run().catch(console.error);

app.listen(config.port, () => {
    console.log(`App is listening on port ${config.port} -- you can GET the Kafka messages`);
});
