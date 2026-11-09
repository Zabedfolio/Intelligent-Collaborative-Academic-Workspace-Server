require('dotenv').config();

const { betterAuth } = require('better-auth');
const { mongodbAdapter } = require('@better-auth/mongo-adapter');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Missing MONGODB_URI environment variable. Please define it in your .env file.');
}

const client = new MongoClient(uri);
const db = client.db(process.env.MONGODB_DB_NAME || 'icaw-db');

const auth = betterAuth({
  database: mongodbAdapter(db, {
    client
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  emailAndPassword: {
    enabled: true
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'student',
        required: false
      },
      department: {
        type: 'string',
        required: false
      },
      semester: {
        type: 'string',
        required: false
      }
    }
  }
});

module.exports = { auth, client, db };
