// Prevent app.js from initializing a real MySQL-backed session store during
// tests. Without a live MySQL server, express-mysql-session's connection
// failure surfaces as an unhandled promise rejection that crashes the Jest
// worker (see test/auth.test.js for the same mocking pattern).
jest.mock("../services/session", () => ({
  createSession: jest.fn(() => (req, res, next) => next())
}));

const app = require("../app");
const config = require("../config");
const request = require("supertest");

describe("GET /health test", () => {
  test(`ping`, async () => {
    const res = await request(app).get("/api/auth/ping").expect(200);
    expect(res.text).toBe("pong");
  });

  test(`version & date`, async () => {
    const res = await request(app).get("/api/auth/version").expect(200);
    expect(res._body.version).toBe(config.version);
  });
});
