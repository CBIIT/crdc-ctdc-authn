const request = require("supertest");

jest.mock('../services/session', () => ({
  createSession: jest.fn(() => (req, res, next) => next())
}));

jest.mock('../services/mysql-connection', () => ({
  getTTL: jest.fn(),
  getPing: jest.fn(),
  getVersion: jest.fn()
}));

const app = require("../app");
const config = require("../config");

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
