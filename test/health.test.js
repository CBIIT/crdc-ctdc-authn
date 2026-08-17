// Keep session mocked for CI/unit stability (no DB service required).
// For real MySQL session integration testing, remove this mock and run Jest
// with DB env configured (e.g., NODE_ENV=test DOTENV_CONFIG_PATH=.env.test ...).
jest.mock('../services/session', () => ({
  createSession: jest.fn(() => (req, _res, next) => {
    req.sessionID = 'test-session-id';
    req.session = { destroy: (cb) => cb && cb() };
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
