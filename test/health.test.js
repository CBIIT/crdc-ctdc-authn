jest.mock("../services/session", () => ({
  createSession: jest.fn(() => (req, _res, next) => {
    req.session = {};
    req.sessionID = "test-session-id";
    next();
  })
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
