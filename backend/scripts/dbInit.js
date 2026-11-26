// D1 - Database initialization & seed data
// Run with: npm run db:init
//
// Sets up an empty (or existing) MongoDB database with everything the app
// needs to run, so no one has to create collections or hash passwords by hand:
//   - the organization that matches ORG_ID
//   - a viewer account and an editor account (passwords hashed with bcrypt)
//   - sample services, clients, and events, with at least one registration
//   - the indexes the app relies on
//
// Safe to re-run: every seeded document has a fixed _id and is written with an
// upsert, so running this twice updates the same records instead of
// duplicating them. Bad or missing config stops the script with exit code 1.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { orgs, users, clients, services, events } = require('../models/models');

const SALT_ROUNDS = 10;
const { ObjectId } = mongoose.Types;

// ---------- 1. Check configuration before touching the database ----------
function fail(message) {
  console.error(`\n[db:init] ERROR: ${message}\n`);
  process.exit(1);
}

function readConfig() {
  const missing = ['MONGO_URL', 'ORG_ID'].filter((name) => !process.env[name]);
  if (missing.length) {
    fail(
      `Missing ${missing.join(', ')} in backend/.env. ` +
        'Copy the values from the README "Environment variables" section.'
    );
  }
  if (!/^[a-f0-9]{24}$/i.test(process.env.ORG_ID)) {
    fail(
      `ORG_ID "${process.env.ORG_ID}" is not a valid MongoDB ObjectId ` +
        '(it must be 24 hexadecimal characters).'
    );
  }
  return {
    mongoUrl: process.env.MONGO_URL,
    orgId: new ObjectId(process.env.ORG_ID),
    orgName: process.env.ORG_NAME || 'Community Health Center',
    viewer: {
      username: process.env.DEMO_VIEWER_USERNAME || 'user',
      password: process.env.DEMO_VIEWER_PASSWORD || 'user'
    },
    editor: {
      username: process.env.DEMO_EDITOR_USERNAME || 'admin',
      password: process.env.DEMO_EDITOR_PASSWORD || 'admin'
    }
  };
}

// ---------- 2. Seed data (fixed _ids keep the script idempotent) ----------
// Second org exists only so org-isolation rules (S1, B1) can be tested:
// nothing from it should ever show up when logged in to ORG_ID.
const OTHER_ORG_ID = new ObjectId('64f000000000000000000099');

const ids = {
  viewer: new ObjectId('64f000000000000000000001'),
  editor: new ObjectId('64f000000000000000000002'),
  services: [
    new ObjectId('64f000000000000000000011'),
    new ObjectId('64f000000000000000000012'),
    new ObjectId('64f000000000000000000013')
  ],
  clients: [
    new ObjectId('64f000000000000000000021'),
    new ObjectId('64f000000000000000000022'),
    new ObjectId('64f000000000000000000023'),
    new ObjectId('64f000000000000000000024')
  ],
  events: [
    new ObjectId('64f000000000000000000031'),
    new ObjectId('64f000000000000000000032'),
    new ObjectId('64f000000000000000000033')
  ],
  otherClient: new ObjectId('64f000000000000000000091'),
  otherEvent: new ObjectId('64f000000000000000000092')
};

// Dates are relative to today so the dashboard's "last two months" chart
// always has data to show.
function daysFromToday(days) {
  const d = new Date();
  d.setHours(10, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function buildServices(orgId) {
  return [
    {
      _id: ids.services[0],
      name: 'Health Screening',
      description: 'Blood pressure, glucose, and BMI checks',
      status: 'Active',
      org: orgId
    },
    {
      _id: ids.services[1],
      name: 'Food Pantry',
      description: 'Weekly grocery distribution',
      status: 'Active',
      org: orgId
    },
    {
      _id: ids.services[2],
      name: 'Flu Vaccination',
      description: 'Seasonal flu shots',
      status: 'Inactive',
      org: orgId
    }
  ];
}

function buildClients(orgId) {
  return [
    {
      _id: ids.clients[0],
      firstName: 'Maria',
      lastName: 'Lopez',
      email: 'maria.lopez@example.com',
      phoneNumber: { primary: '7135550101' },
      address: { line1: '101 Main St', city: 'Houston', county: 'Harris', zip: '77002' },
      orgs: [orgId]
    },
    {
      _id: ids.clients[1],
      firstName: 'James',
      middleName: 'R',
      lastName: 'Carter',
      email: 'james.carter@example.com',
      phoneNumber: { primary: '7135550102', alternate: '8325550102' },
      address: { line1: '220 Elm St', city: 'Houston', county: 'Harris', zip: '77004' },
      orgs: [orgId]
    },
    {
      _id: ids.clients[2],
      firstName: 'Linh',
      lastName: 'Nguyen',
      phoneNumber: { primary: '7135550103' },
      address: { line1: '35 Bellaire Blvd', city: 'Houston', county: 'Harris', zip: '77036' },
      orgs: [orgId]
    },
    {
      _id: ids.clients[3],
      firstName: 'Aisha',
      lastName: 'Johnson',
      email: 'aisha.johnson@example.com',
      phoneNumber: { primary: '7135550104' },
      address: { line1: '480 Oak Ave', city: 'Houston', county: 'Harris', zip: '77004' },
      orgs: [orgId]
    }
  ];
}

function buildEvents(orgId) {
  const address = { line1: '1200 Community Way', city: 'Houston', county: 'Harris', zip: '77004' };
  return [
    {
      _id: ids.events[0],
      org: orgId,
      name: 'Community Health Fair',
      services: [ids.services[0], ids.services[2]],
      date: daysFromToday(-30),
      address,
      description: 'Free screenings and vaccinations',
      // registrations: event registrations live in the attendees array
      attendees: [ids.clients[0], ids.clients[1], ids.clients[2]]
    },
    {
      _id: ids.events[1],
      org: orgId,
      name: 'Food Distribution Day',
      services: [ids.services[1]],
      date: daysFromToday(-7),
      address,
      description: 'Monthly grocery distribution',
      attendees: [ids.clients[1], ids.clients[3]]
    },
    {
      _id: ids.events[2],
      org: orgId,
      name: 'Wellness Workshop',
      services: [ids.services[0]],
      date: daysFromToday(14),
      address,
      description: 'Upcoming workshop with no registrations yet',
      attendees: []
    }
  ];
}

// ---------- 3. Helpers ----------
// Upsert by _id: inserts the first time, overwrites the same record after that.
async function upsertAll(Model, docs) {
  if (!docs.length) return;
  await Model.bulkWrite(
    docs.map((doc) => ({
      replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true }
    }))
  );
}

async function createIndexes() {
  // One username per org (login looks users up by username + org)
  await users.collection.createIndex({ username: 1, org: 1 }, { unique: true });
  await clients.collection.createIndex({ orgs: 1 });
  await clients.collection.createIndex({ 'address.zip': 1 });
  await services.collection.createIndex({ org: 1 });
  await events.collection.createIndex({ org: 1, date: -1 });
  await events.collection.createIndex({ attendees: 1 });
}

// Confirms the seeded accounts can actually log in with their passwords.
async function verifyLogin(account, orgId) {
  const user = await users.findOne({ username: account.username, org: orgId });
  if (!user || !(await bcrypt.compare(account.password, user.password))) {
    throw new Error(`Seeded account "${account.username}" failed the login check.`);
  }
}

// ---------- 4. Main ----------
async function main() {
  const config = readConfig();
  mongoose.set('strictQuery', false);

  console.log('[db:init] Connecting to MongoDB...');
  try {
    await mongoose.connect(config.mongoUrl, { serverSelectionTimeoutMS: 8000 });
  } catch (err) {
    fail(`Could not connect to MongoDB with MONGO_URL. Check the URL and that the database is running. (${err.message})`);
  }

  try {
    console.log('[db:init] Writing organizations...');
    await upsertAll(orgs, [
      { _id: config.orgId, name: config.orgName },
      { _id: OTHER_ORG_ID, name: 'Other Organization (isolation test)' }
    ]);

    console.log('[db:init] Writing demo users (bcrypt-hashed passwords)...');
    await upsertAll(users, [
      {
        _id: ids.viewer,
        username: config.viewer.username,
        password: await bcrypt.hash(config.viewer.password, SALT_ROUNDS),
        role: 'viewer',
        org: config.orgId
      },
      {
        _id: ids.editor,
        username: config.editor.username,
        password: await bcrypt.hash(config.editor.password, SALT_ROUNDS),
        role: 'editor',
        org: config.orgId
      }
    ]);

    console.log('[db:init] Writing services, clients, and events...');
    await upsertAll(services, buildServices(config.orgId));
    await upsertAll(clients, [
      ...buildClients(config.orgId),
      {
        _id: ids.otherClient,
        firstName: 'Other',
        lastName: 'OrgClient',
        phoneNumber: { primary: '7135550199' },
        address: { city: 'Dallas', zip: '75201' },
        orgs: [OTHER_ORG_ID]
      }
    ]);
    await upsertAll(events, [
      ...buildEvents(config.orgId),
      {
        _id: ids.otherEvent,
        org: OTHER_ORG_ID,
        name: 'Other Org Event',
        date: daysFromToday(-3),
        attendees: [ids.otherClient]
      }
    ]);

    console.log('[db:init] Creating indexes...');
    await createIndexes();

    console.log('[db:init] Verifying demo logins...');
    await verifyLogin(config.viewer, config.orgId);
    await verifyLogin(config.editor, config.orgId);

    const counts = {
      orgs: await orgs.countDocuments(),
      users: await users.countDocuments({ org: config.orgId }),
      services: await services.countDocuments({ org: config.orgId }),
      clients: await clients.countDocuments({ orgs: config.orgId }),
      events: await events.countDocuments({ org: config.orgId })
    };
    console.log('[db:init] Done. Records for ORG_ID:', counts);
    console.log(`[db:init] Viewer login: ${config.viewer.username} / ${config.viewer.password}`);
    console.log(`[db:init] Editor login: ${config.editor.username} / ${config.editor.password}`);
  } catch (err) {
    if (err.code === 11000) {
      fail(`Duplicate key: a record already uses one of the seeded usernames. (${err.message})`);
    }
    fail(err.message);
  } finally {
    await mongoose.disconnect();
  }
}

main();