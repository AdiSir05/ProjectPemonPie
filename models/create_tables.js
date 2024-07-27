const dbaccess = require('./db_access');
const config = require('../config.json'); // Load configuration

async function create_tables(db) {
  // Tables for lemonpie users
  // Tables needed: users, posts, friends, chats, chat_members, messages
  var q1 = db.create_tables('CREATE TABLE IF NOT EXISTS users ( \
    user_id INT NOT NULL AUTO_INCREMENT, \
    username VARCHAR(255), \
    hashed_password VARCHAR(255), \
    first_name VARCHAR(255), \
    last_name VARCHAR(255), \
    affiliation VARCHAR(255), \
    email VARCHAR(255), \
    birth_date DATE, \
    interests TEXT, \
    bio TEXT, \
    image_url VARCHAR(255), \
    PRIMARY KEY (user_id) \
    )');
    
  var q2 = db.create_tables('CREATE TABLE IF NOT EXISTS posts ( \
    post_id INT NOT NULL AUTO_INCREMENT, \
    user_id INT, \
    post_date DATE, \
    post_time TIME, \
    post_text TEXT, \
    post_interests TEXT, \
    image_url VARCHAR(255), \
    PRIMARY KEY (post_id), \
    FOREIGN KEY (user_id) REFERENCES users(user_id) \
    )');

  var q3 = db.create_tables('CREATE TABLE IF NOT EXISTS comments ( \
    comment_id INT PRIMARY KEY, \
    post_id INT, \
    user_id INT, \
    comment_date DATE, \
    comment_time TIME, \
    comment_text TEXT, \
    FOREIGN KEY (post_id) REFERENCES posts(post_id), \
    FOREIGN KEY (user_id) REFERENCES users(user_id) \
    )');

  var q4 = db.create_tables('CREATE TABLE IF NOT EXISTS likes ( \
    like_id INT PRIMARY KEY, \
    post_id INT, \
    user_id INT, \
    FOREIGN KEY (post_id) REFERENCES posts(post_id), \
    FOREIGN KEY (user_id) REFERENCES users(user_id) \
    )');
  
  var q5 = db.create_tables('CREATE TABLE IF NOT EXISTS followers ( \
    followed INT, \
    follower INT, \
    accepted BOOLEAN, \
    PRIMARY KEY (followed, follower), \
    FOREIGN KEY (followed) REFERENCES users(user_id), \
    FOREIGN KEY (follower) REFERENCES users(user_id) \
    )');
  
  var q6 = db.create_tables('CREATE TABLE IF NOT EXISTS chats ( \
    chat_id INT PRIMARY KEY, \
    chat_name VARCHAR(255) \
    )');
  
  var q7 = db.create_tables('CREATE TABLE IF NOT EXISTS chat_members ( \
    chat_id INT, \
    user_id INT, \
    is_member BOOLEAN, \
    PRIMARY KEY (chat_id, user_id), \
    FOREIGN KEY (chat_id) REFERENCES chats(chat_id), \
    FOREIGN KEY (user_id) REFERENCES users(user_id) \
    )');
  
  var q8 = db.create_tables('CREATE TABLE IF NOT EXISTS messages ( \
    message_id INT PRIMARY KEY, \
    chat_id INT, \
    user_id INT, \
    message_date DATE, \
    message_time TIME, \
    message_text TEXT, \
    FOREIGN KEY (chat_id) REFERENCES chats(chat_id), \
    FOREIGN KEY (user_id) REFERENCES users(user_id) \
    )');
  
  // Tables for actor information
  // Tables needed: actor_names, actor_titles, actor_principals, actor_recommendations, actor_friends
  var q9 = db.create_tables('CREATE TABLE IF NOT EXISTS actor_names ( \
    nconst VARCHAR(10) PRIMARY KEY, \
    primaryName VARCHAR(255), \
    birthYear INT, \
    deathYear INT \
    )');

  var q10 = db.create_tables('CREATE TABLE IF NOT EXISTS actor_titles ( \
    tconst VARCHAR(10) PRIMARY KEY, \
    titleType VARCHAR(255), \
    primaryTitle VARCHAR(255), \
    originalTitle VARCHAR(255), \
    startYear INT, \
    endYear INT, \
    genres VARCHAR(255) \
    )');

  var q11 = db.create_tables('CREATE TABLE IF NOT EXISTS actor_principals ( \
    tconst VARCHAR(10), \
    ordering INT, \
    nconst VARCHAR(255), \
    category VARCHAR(255), \
    job VARCHAR(255), \
    characters VARCHAR(255), \
    PRIMARY KEY (tconst, nconst), \
    FOREIGN KEY (tconst) REFERENCES actor_titles(tconst), \
    FOREIGN KEY (nconst) REFERENCES actor_names(nconst) \
    )');
  
  var q12 = db.create_tables('CREATE TABLE IF NOT EXISTS actor_recommendations ( \
    person VARCHAR(255), \
    recommendation VARCHAR(255), \
    PRIMARY KEY (person, recommendation), \
    FOREIGN KEY (person) REFERENCES actor_names(nconst), \
    FOREIGN KEY (recommendation) REFERENCES actor_names(nconst) \
    )');

  var q13 = db.create_tables('CREATE TABLE IF NOT EXISTS actor_friends ( \
    followed VARCHAR(255), \
    follower VARCHAR(255), \
    strength INT, \
    PRIMARY KEY (followed, follower), \
    FOREIGN KEY (followed) REFERENCES actor_names(nconst), \
    FOREIGN KEY (follower) REFERENCES actor_names(nconst) \
    )');

  var q14 = db.create_tables('CREATE TABLE IF NOT EXISTS closest_actor ( \
    user_id INT, \
    actor_id VARCHAR(255), \
    PRIMARY KEY (user_id, actor_id), \
    FOREIGN KEY (user_id) REFERENCES users(user_id), \
    FOREIGN KEY (actor_id) REFERENCES actor_names(nconst) \
    )');

  /* Using this table to store actor photos */
  
  var q15 = db.create_tables('CREATE TABLE IF NOT EXISTS actor_photos ( \
    nconst VARCHAR(10), \
    photo_url VARCHAR(255), \
    embeddingValue VARCHAR(255), \
    PRIMARY KEY (nconst, photo_url), \
    FOREIGN KEY (nconst) REFERENCES actor_names(nconst) \
    )');

  var q16 = db.create_tables('CREATE TABLE IF NOT EXISTS linked_actors ( \
    user_id INT, \
    actor_id VARCHAR(255), \
    PRIMARY KEY (user_id, actor_id), \
    FOREIGN KEY (user_id) REFERENCES users(user_id), \
    FOREIGN KEY (actor_id) REFERENCES actor_names(nconst) \
    )');

  var q17 = db.create_tables("CREATE TABLE IF NOT EXISTS TopRankedPosts ( \
  post_id INT, \
  FOREIGN KEY (post_id) REFERENCES posts(post_id) \
  )");

  // suggested posts that have already been shown to a user
  var q18 = db.create_tables("CREATE TABLE IF NOT EXISTS ShownSuggestedPosts ( \
    post_id INT, \
    FOREIGN KEY (post_id) REFERENCES posts(post_id) \
    )");

  var q19 = db.create_tables("CREATE TABLE IF NOT EXISTS kafkaUsers ( \
    user_id INT, \
    kafka_id TEXT, \
    kafka_group TEXT, \
    PRIMARY KEY (user_id), \
    FOREIGN KEY (user_id) REFERENCES users(user_id) \
    )");

  var q20 = db.create_tables('CREATE TABLE IF NOT EXISTS kafkaPosts ( \
      post_id INT NOT NULL AUTO_INCREMENT, \
      user_id INT, \
      post_date DATE, \
      post_time TIME, \
      post_text TEXT, \
      post_interests TEXT, \
      image_url VARCHAR(255), \
      PRIMARY KEY (post_id), \
      FOREIGN KEY (user_id) REFERENCES users(user_id) \
      )');

  return await Promise.all([q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, q15, q16, q17, q18, q19, q20]).then(async () => {
    // Once all tables are created, close the database connection
    await dbaccess.close_db();
    console.log("dbaccess closed db");
  });
}

// Database connection setup
const db = dbaccess.get_db_connection();

var result = create_tables(dbaccess);
console.log('Tables created');
// dbaccess.close_db();

const PORT = config.serverPort;
