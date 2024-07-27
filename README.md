# NETS 2120 Course Project

## Lemon Pie (g06)

Contributors: 
* Eric Chen - enchen@seas.upenn.edu
* Jason Gao - jasongao@seas.upenn.edu
* Aditya Sirohi - asirohi@seas.upenn.edu
* Lucas Wu - lucaswu@seas.upenn.edu

## Features Implemented

* User Signup and User Accounts
* User Login
* User Page / Main Content Feed
* User Profile
* Edit Profile
* User Posts
* Commenting / Likes / Hashtags
* Home Feed
* Feed Updates
* User Actions
* Ranking Posts - Social Rank
* Federated Posts
* Secondary Screens: Profile, Friends, Chat Home, Search
* Chat 
* Scalability 
* Friend Recommendations
* LinkedIn style connect and decline requests where users can “confirm” or “delete” follow requests. If confirmed, the user is then able to request to “follow back.” 
* Privacy controls were implemented building off our follow/follow-back system such that a user’s home feed is only composed of their posts, their friends’ posts, and public posts such as Twitter (X) and federated posts. This privacy control system was essential in creating the privacy controls that Instagram utilizes.
* File handling between the frontend and backend utilized Multer, a node.js middleware. Multer was used also for the S3 container/actor mapping endpoints.


## Source Files 

 Here are some of the key files within our project. 

Lemon-pie
- frontend
  - pages
    - Chat.tsx
    - ChatHome.tsx
    - CreatePost.tsx
    - EditProfile.tsx
    - Friends.tsx
    - Home.tsx
    - Login.tsx
    - Password.tsx
    - Profile.tsx
    - Signup.tsx
- routes
  - actor_routes.js
  - chat_routes.js
  - feed_routes.js
  - register_routes.js
  - route_helper.js
  - routes_old.js
  - search_routes.js
  - user_routes.js
- models
  - choma_access.js
  - create_tables.js
  - db_access.js
  - kafkfa.js
- social_rank
  - ComputeRank.java
  - CreateGraph.java
- app.js

## Code Delaration

All code written in this project was written by the team members listed above. 

## Instructions to Run

In order to run Lemonstagram. Complete the following steps:

### Clone the Code

* Navigate to this repository
* Click the green Code button and copy the SSH link
* In your local termimanl, navigate to the folder you want to store this project
* Clone the repository by running `git clone <ssh link> lemon-pie`. This should create a new folder `lemon-pie` with the contents of the repository inside of your designated directory.

### Docker Setup

1. Launch the Docker Desktop app.
2. Open up a terminal window
3. Enter: `docker start your_folder_name`
4. Enter: `docker exec -it your_folder_name bash`. This should enter you into the docker shell.

### Connecting to AWS

1. Launch the AWS Learner Lab
2. When the status turns green, click on "AWS Details," then show next to "AWS CLI." Copy the AWS CLI
   configuration text.
3. In Docker, run:
    * `mkdir ~/.aws` (only if the directory does not already exist)
    * `touch ~/.aws/credentials`
    * `echo "[copied config]" > ~/.aws/credentials`

**Note**: Each session lasts for 4 hours max, and credentials must be re-entered each session in Learner's Lab.

### EC2 Instance Setup

In the *AWS Console*, go to **EC2**, Instances, and click on **Launch Instances**.

1. Name the instance `Tunnel`.
1. Pick *Ubuntu* from the Application and OS Images Quick Start.
1. Scroll down to **Instance Type** and pick **t2.nano**.

### Link RDS and EC2 Nano Instance

From your browser, go into the AWS Console's EC2 Dashboard. Click on the details of your `tunnel` server. Go to the **Actions** menu and select **Networking**.  Click on **Connect RDS Database**. Choose **Instance**, then select your RDS database from the list.

### Tunneling

You'll need to collect two hostnames:
1. The name of your RDS server, e.g., database-2.czkkqa8wuy3r.us-east-1.rds.amazonaws.com
2. The name of your EC2 nano tunnel server, e.g., ec2-3-86-71-131.compute-1.amazonaws.com

Edit this command, setting the `dbserver` and `tunnelserver` (it should be a single line):

```
ssh -i ~/.ssh/tunnel.pem -4 -L 3306:dbserver:3306 ubuntu@tunnelserver
```

As an example, here is a version that worked for us:

```
ssh -i ~/.ssh/tunnel.pem -4 -L 3306:database-2.czkkqa8wuy3r.us-east-1.rds.amazonaws.com:3306 ubuntu@ec2-3-86-71-131.compute-1.amazonaws.com
```

**First-Time You Connect to the New Tunnel**. The first time you create the tunnel server, may need to answer `yes` to whether you trust the server.  You'll be logged into an Amazon EC2 node at this point.

**Only do this if you re-created your RDS instance, rather than restarting it**.
Run `sudo apt update` and then `sudo apt install mysql-client-core-8.0` so you have the MySQL client on EC2.  Next you'll need to log into the RDS server.  Do this by running (replacing the host with your version of the RDS database domain above, e.g., `imdbdatabase...amazonaws.com``):

```
mysql --host=imdbdatabase.....amazonaws.com --user=admin --password=rds-password
```

Until `ssh` exits, you'll have a "tunnel" set up so requests in your container for `localhost` port `3306` get redirected to the tunnel server; then it makes requests to the database server on your behalf.

Leave this terminal open until you are done. Meanwhile you'll want to create a new terminal connection (e.g., via `docker exec -it your_folder_name bash`) to do your remaining work.

### Configuration Setup

To connect your backend service to an AWS RDS instance, you will need to (1) create a `.env` file with credentials, and (2) modify [config.json](config.json) to use the connection information for your RDS database.

`.env` should have items from your AWS Academy Details first, then your RDS user ID (possibly `admin` but it depends on your settings) and password, then an OpenAPI key (we will provide one):
```
export AWS_ACCESS_KEY_ID=
export AWS_SECRET_ACCESS_KEY=
export AUTH_TOKEN=
export RDS_USER=
export RDS_PWD=
export OPENAI_API_KEY=
export USE_PERSISTENCE=TRUE
```

`config.json` should have:
1. **Host**: The `host` value is the endpoint of your RDS instance. This endpoint is provided in the
   RDS dashboard and typically looks
   like `your-db-instance.cg034hpkmmjt.us-east-1.rds.amazonaws.com`. **However, for this
   assignment**, because we use a tunnel to forward requests, **you should set the host to
   `localhost`**.
2. **Port**: Ensure the `port` value matches the port used by your RDS instance. The default MySQL
   port is `3306`, but check your RDS instance settings to confirm.
3. **Database**: Ensure the `database` field matches the name of the database within your RDS
   instance you wish to connect to.

After updating `config.json`, your configuration should look something like this (note: these are
example values, replace them with your actual RDS details):

```json
{
  "database": {
    "host": "localhost",
    "port": "3306",
    "database": "yourRdsDatabaseName"
  },
  "serverPort": "8080"
}
```

You will rely on an SSH tunnel to connect to the RDS instance.

### TensorFlow Setup

You will need to install some more packages to use TensorFlow for face detection.

* apt update
* apt install -y libhdf5-serial-dev pkg-config
* pip install h5py
p* ip install tensorflow

Then run npm install from this directory.

Then:

* npm rebuild @tensorflow/tfjs-node --build-from-source





# AFTER SETUP

### Running the Server

**Backend**

`cd` to `../lemon-pie` within Docker directory. Run the following: 
* npm install
* npm start

This should start the backend. 

**Frontend**

`cd` to `../lemon-pie/frontend` within Docker directory. Run the following:

* npm install
* npm run dev --host
* `cmd + click` to the local host link provided (http://localhost:4567/ or similar)
