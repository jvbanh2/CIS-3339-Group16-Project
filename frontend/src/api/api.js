// This file contains all API calls to the API endpoints
// import axios to make API calls
import axios from "axios";
import router from "../router";
import { useLoggedInUserStore } from "../store/loggedInUser";

// Create HTTP client with the base URL, and specify that the data sent in the request body is JSON
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_ROOT_API,
  headers: {
    "Content-Type": "application/json",
  },
});

// Login related API calls
// If user logs in successfully, this login sets a header to "apiClient" called "Authorization" with the value of "Bearer <token>" This security token is used to validate API calls
export function setAuthHeader(token) {
  apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// When user logs out, this function removes the Authorization header from apiClient
function removeAuthHeader() {
  delete apiClient.defaults.headers.common["Authorization"];
}

// Sprint 2, F2: pulls a short, human-readable message out of an axios error.
// Used only by the response interceptor below -- this is the single place in
// the app that turns a raw error into the string a user actually sees.
function extractErrorMessage(error) {
  if (!error.response) {
    // no response at all -- the backend is down or unreachable
    return "Unable to reach the server.";
  }

  const data = error.response.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }
  if (data && typeof data === "object") {
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (Array.isArray(data.errors) && data.errors[0] && data.errors[0].msg) {
      return data.errors[0].msg;
    }
  }

  return `Request failed (${error.response.status})`;
}

// Sprint 2, F2: single centralized response interceptor. This replaces the
// ~30 near-identical try/catch wrappers that used to live on every function
// below (and the two inconsistent ways they threw errors -- `throw error`
// vs `throw error.response.data`, the second of which crashed with a
// TypeError whenever the backend was unreachable, since there was no
// `error.response` to read `.data` off of).
//
// Every API call below now just returns `response.data` with no try/catch of
// its own. On failure, this interceptor is the only place that runs: it
// turns the raw axios error into a plain Error with a short .message, and on
// a 401 it clears the stored session and sends the user to /login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("authToken");
      removeAuthHeader();
      const store = useLoggedInUserStore();
      store.$patch({ name: "", role: "", isLoggedIn: false });
      router.push("/login");
    }

    return Promise.reject(new Error(extractErrorMessage(error)));
  }
);

// API call to log the user in
export async function loginUser(username, password) {
  const response = await apiClient.post("/users/login", {
    username,
    password,
  });
  const token = response.data.token;
  localStorage.setItem("authToken", token);
  setAuthHeader(token);
  return token;
}

// API call to log the user out
export function logoutUser() {
  localStorage.removeItem("authToken");
  removeAuthHeader();
}

// Org related API calls
// API call to get org name
export async function getOrgName() {
  const response = await apiClient.get(`/org`);
  return response.data;
}

// Events related API calls
// API call to get all events for org
export const getEvents = async () => {
  const response = await apiClient.get("/events/");
  return response.data;
};

// API call to GET single event by ID
export const getEventById = async (id) => {
  const response = await apiClient.get(`/events/id/${id}`);
  return response.data;
};

// API call to GET events based on search query
export const searchEvents = async (query) => {
  let params = {};
  if (query.searchBy === "name") {
    params.searchBy = query.searchBy;
    params.name = query.name || "";
  } else if (query.searchBy === "date") {
    params.searchBy = "date";
    params.eventDate = query.eventDate || "";
  }
  const response = await apiClient.get(`/events/search`, {
    params: params,
  });
  return response.data;
};

// API call to GET events for which a client is signed up
export const getClientEvents = async (id) => {
  const response = await apiClient.get(`/events/client/${id}`);
  return response.data;
};

// API call to GET events for which a client is not signed up
export const getNonClientEvents = async (id) => {
  const response = await apiClient.get(`/events/client/${id}/not-registered`);
  return response.data;
};

// API call to GET all attendees for an event
export const getEventAttendees = async (id) => {
  const response = await apiClient.get(`/events/attendees/${id}`);
  return response.data;
};

// API call to GET all events for a given service
export const getEventsByServiceId = async (id) => {
  const response = await apiClient.get(`/events/service/${id}`);
  return response.data;
};

// API call to POST new event
export const createEvent = async (eventData) => {
  const response = await apiClient.post("/events/", eventData);
  return response.data;
};

// API call to PUT update event
export const updateEvent = async (id, eventData) => {
  const response = await apiClient.put(`/events/update/${id}`, eventData);
  return response.data;
};

// API call to PUT add attendee to event
export const registerAttendee = async (eventId, clientId) => {
  const response = await apiClient.put(
    `/events/register`,
    {},
    {
      params: {
        event: eventId,
        client: clientId,
      },
    }
  );
  return response.data;
};

// API call to PUT remove attendee from event
export const deregisterAttendee = async (eventId, clientId) => {
  const response = await apiClient.put(
    `/events/deregister`,
    {},
    {
      params: {
        event: eventId,
        client: clientId,
      },
    }
  );
  return response.data;
};

// API call to DELETE event by ID
export const deleteEvent = async (id) => {
  const response = await apiClient.delete(`/events/${id}`);
  return response.data;
};

// API call to get events for last two month for dashboard
export const getAttendance = async () => {
  const response = await apiClient.get("/events/attendance");
  return response.data;
};

// Clients related API calls
// API call to GET all clients for org
export const getClients = async () => {
  const response = await apiClient.get("clients");
  return response.data;
};

// API call to GET single client by ID
export const getClientById = async (id) => {
  const response = await apiClient.get(`/clients/id/${id}`);
  return response.data;
};

// API call to GET entries based on search query
export const searchClients = async (query) => {
  let params = {};
  if (query.searchBy === "name") {
    params.searchBy = query.searchBy;
    params.firstName = query.firstName || "";
    params.lastName = query.lastName || "";
  } else if (query.searchBy === "number") {
    params.searchBy = query.searchBy;
    params.phoneNumber = query.phoneNumber || "";
  }
  const response = await apiClient.get("/clients/search", {
    params: params,
  });
  return response.data;
};

// API call to POST new client
export const createClient = async (newClient) => {
  const response = await apiClient.post("/clients", newClient);
  return response.data;
};

// API call to PUT update client
export const updateClient = async (id, updatedClient) => {
  const response = await apiClient.put(
    `/clients/update/${id}`,
    updatedClient
  );
  return response.data;
};

// API call to delete client
export const deleteClientbyId = async (id) => {
  const response = await apiClient.delete(`/clients/${id}`);
  return response.data;
};

// API call to get events for dashboard
export const getClientsByZipCode = async () => {
  const response = await apiClient.get("/clients/byzip");
  return response.data;
};

// API calls related to services
// API call to get all services for org
export const getServices = async () => {
  const response = await apiClient.get("/services/");
  return response.data;
};

// API call to GET single service by ID
export const getServiceById = async (id) => {
  const response = await apiClient.get(`/services/id/${id}`);
  return response.data;
};

// API call to GET services based on search query
export const searchServices = async (query) => {
  let params = {};
  params.searchBy = query.searchBy;
  if (query.searchBy === "name") {
    params.name = query.name || "";
  } else if (query.searchBy === "description") {
    params.description = query.description;
  }
  const response = await apiClient.get("/services/search", {
    params: params,
  });
  return response.data;
};

// API call to POST new service
export const createService = async (newService) => {
  const response = await apiClient.post("/services", newService);
  return response.data;
};

// API call to PUT update service
export const updateService = async (id, updatedService) => {
  const response = await apiClient.put(
    `/services/update/${id}`,
    updatedService
  );
  return response.data;
};

// API call to DELETE service by ID
export const deleteService = async (id) => {
  const response = await apiClient.delete(`/services/${id}`);
  return response.data;
};
