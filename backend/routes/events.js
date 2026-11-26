// This file contains API endpoints for interacting with the "events" collection in the MongoDB database
const express = require("express");
const router = express.Router();

const org = process.env.ORG_ID;

// Middleware for authorization. For API calls that require authorization, this middleware checks if the header of API calls have a valid security token. If no security token or invalid security token, then the API call is not made.
const authMiddleWare = require("../auth/authMiddleWare");
const requireRole = require("../auth/requireRole");

// importing data model schemas
const { events, clients } = require("../models/models");

// API endpoint to get all events for org
router.get("/", authMiddleWare, (req, res, next) => {
  events
    .find({ org: org }, (error, data) => {
      if (error) {
        return next(error);
      } else {
        return res.json(data);
      }
    })
    // sort by date descending
    .sort({ date: -1 });
});

// API endpoint to GET single event by ID
router.get("/id/:id", authMiddleWare, (req, res, next) => {
  events.findOne({ _id: req.params.id, org: org }, (error, data) => {
    if (error) {
      return next(error);
    } else if (!data) {
      res.status(400).send("Event not found");
    } else {
      res.json(data);
    }
  });
});

// API endpoint to GET events based on search query
// Ex: '...?name=Food&searchBy=name'
router.get("/search/", authMiddleWare, (req, res, next) => {
  const dbQuery = { org: org };
  switch (req.query.searchBy) {
    case "name":
      dbQuery.name = { $regex: `${req.query.name}`, $options: "i" };
      break;
    case "date":
      dbQuery.date = req.query.eventDate;
      break;
    default:
      return res.status(400).send("invalid searchBy");
  }
  events.find(dbQuery, (error, data) => {
    if (error) {
      return next(error);
    } else {
      res.json(data);
    }
  });
});

// API endpoint to GET events for which a client is signed up
router.get("/client/:id", authMiddleWare, (req, res, next) => {
  events.find({ attendees: req.params.id, org: org }, (error, data) => {
    if (error) {
      return next(error);
    } else {
      res.json(data);
    }
  });
});

// API endpoint to GET events for which a client is not signed up
router.get(
  "/client/:id/not-registered",
  authMiddleWare,
  async (req, res, next) => {
    try {
      const eventsNotRegistered = await events.find({
        attendees: { $nin: [req.params.id] },
        org: org,
      });
      res.json(eventsNotRegistered);
    } catch (error) {
      next(error);
    }
  }
);

// API endpoint to GET attendee details for an event
router.get("/attendees/:id", authMiddleWare, (req, res, next) => {
  events.findById(req.params.id, (error, event) => {
    if (error) {
      return next(error);
    } else {
      if (!event)
        res.status(400).send("Event not found")
      else {
        const attendeeIds = event.attendees.map((attendee) =>
          attendee.toString()
        );
        clients.find({ _id: { $in: attendeeIds } }, (error, clients) => {
          if (error) {
            return next(error);
          } else {
            res.json(clients);
          }
        });
      }
    };
  });
});

// API endpoint to GET all events for a given service
router.get("/service/:id", authMiddleWare, async (req, res, next) => {
  try {
    const eventsWithService = await events
      .find({ services: { $in: [req.params.id] }, org: org })
      .select({ _id: 1, name: 1, date: 1, address: { line1: 1 } })
      .lean();
    res.json(eventsWithService);
  } catch (error) {
    next(error);
  }
});

// API endpoint to POST new event
router.post("/", authMiddleWare, (req, res, next) => {
  const newEvent = req.body;
  newEvent.org = org;
  events.create(newEvent, (error, data) => {
    if (error) {
      return next(error);
    } else {
      res.status(200).send("New event created successfully");
    }
  });
});

// API endpoint to PUT -> update event
router.put("/update/:id", authMiddleWare, (req, res, next) => {
  events.findOneAndUpdate(
    { _id: req.params.id, org: org },
    req.body,
    (error, data) => {
      if (error) {
        return next(error);
      } else {
        res.status(200).send("Event updated successfully");
      }
    }
  );
});

// B1: Event registration rules
// Registrations are stored in each event's `attendees` array (client ids).
// Both endpoints:
//   - require a logged-in editor (authMiddleWare + requireRole('editor'))
//   - return 404 if the event or client doesn't exist or belongs to another org
//   - never create duplicates or crash on repeat calls

// A valid MongoDB id is 24 hex characters. Anything else can't match a record,
// so it's treated as "not found" instead of causing a 500 error.
const isValidId = (id) => typeof id === "string" && /^[a-f0-9]{24}$/i.test(id);

// Looks up the event and client, both restricted to this backend's org.
// Returns null if either is missing, invalid, or in a different org.
async function findEventAndClient(eventId, clientId) {
  if (!isValidId(eventId) || !isValidId(clientId)) return null;
  const [event, client] = await Promise.all([
    events.findOne({ _id: eventId, org: org }),
    clients.findOne({ _id: clientId, orgs: org })
  ]);
  if (!event || !client) return null;
  return { event, client };
}

// API endpoint to PUT -> register a client for an event
// Ex: PUT /events/register?event=<eventId>&client=<clientId>
router.put(
  "/register",
  authMiddleWare,
  requireRole("editor"),
  async (req, res, next) => {
    try {
      const { event: eventId, client: clientId } = req.query;
      if (!(await findEventAndClient(eventId, clientId))) {
        return res.status(404).json({ error: "Client or event not found" });
      }
      // Single atomic update: only adds the client if they aren't already in
      // attendees, so two requests at once still can't create a duplicate.
      const result = await events.updateOne(
        { _id: eventId, org: org, attendees: { $ne: clientId } },
        { $addToSet: { attendees: clientId } }
      );
      if (result.modifiedCount === 0) {
        return res.status(200).json({ message: "Already registered" });
      }
      res.status(200).json({ message: "Client registered for event" });
    } catch (err) {
      next(err);
    }
  }
);

// API endpoint to PUT -> deregister a client from an event
// Ex: PUT /events/deregister?event=<eventId>&client=<clientId>
router.put(
  "/deregister",
  authMiddleWare,
  requireRole("editor"),
  async (req, res, next) => {
    try {
      const { event: eventId, client: clientId } = req.query;
      if (!(await findEventAndClient(eventId, clientId))) {
        return res.status(404).json({ error: "Client or event not found" });
      }
      const result = await events.updateOne(
        { _id: eventId, org: org },
        { $pull: { attendees: clientId } }
      );
      if (result.modifiedCount === 0) {
        return res.status(200).json({ message: "Not registered" });
      }
      res.status(200).json({ message: "Client deregistered from event" });
    } catch (err) {
      next(err);
    }
  }
);

// API endpoint to hard DELETE event by ID
router.delete("/:id", authMiddleWare, (req, res, next) => {
  events.findOne({ _id: req.params.id, org: org }, (error, data) => {
    if (error) {
      return next(error);
    } else if (!data) {
      res.status(400).send("Event not found");
    } else {
      // only delete event if no clients are signed up
      if (data.attendees.length === 0) {
        events.findOneAndDelete(
          { _id: req.params.id, org: org },
          (error, data) => {
            if (error) {
              return next(error);
            } else if (!data) {
              res.status(400).send("Event not found");
            } else {
              res.status(200).send("Event deleted successfully");
            }
          }
        );
      } else {
        res.status(400).send("Event has attendees and can't be deleted.");
      }
    }
  });
});

// GET event attendance for the past two months for dashboard
router.get("/attendance", (req, res, next) => {
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  events
    .find({ org: org, date: { $gte: twoMonthsAgo } }, (error, data) => {
      if (error) {
        return next(error);
      } else {
        res.json(data);
      }
    })
    .sort({ date: 1 });
});

module.exports = router;