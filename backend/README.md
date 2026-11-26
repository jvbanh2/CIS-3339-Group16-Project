# Backend

This implementation is for NodeJS based on [Express](https://expressjs.com/) and [MongoDB](https://www.mongodb.com/) and uses [mongoose](https://mongoosejs.com/) as the ODM.

## Project setup

Install all dependencies.

    npm install

### Before startup

You need a MongoDB database (local or remote). You do not need to create any collections or hash any passwords by hand.

1. Make sure `backend/.env` exists with these variables (the committed file already has working course-project values):

        MONGO_URL=mongodb://127.0.0.1:27017/dataplatform
        PORT=3000
        ORG_ID=64e0380b3cc28d087655693b
        JWT_SECRET=<any random string>

2. Initialize the database:

        npm run db:init

This creates the organization matching `ORG_ID`, two demo accounts, sample services, clients, and events (with registrations), and the indexes the app needs. Passwords are hashed with bcrypt. The script is safe to run more than once and will not create duplicates. If a setting is missing or the database can't be reached, it stops with an error message and exit code 1.

Demo accounts:

| Role   | Username | Password |
|--------|----------|----------|
| viewer | user     | user     |
| editor | admin    | admin    |

The script also creates a second organization with one client and one event. That data belongs to a different org and should never appear in the app; it is there to test organization isolation.

### Compiles and hot-reloads for development

To start up the backend for devlopment run:

    npm start

## Postman Documentation

More details about the API endpoints can be be found at <https://documenter.getpostman.com/view/25012176/2s9Y5Zv1xz>