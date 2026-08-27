// Mock MySQL session store before importing app
jest.mock("express-mysql-session", () => {
  return () => {
    return class MockMySQLStore {
      constructor() {}
      get(sid, callback) {
        callback(null, {});
      }
      set(sid, session, callback) {
        callback(null);
      }
      destroy(sid, callback) {
        callback(null);
      }
      touch(sid, session, callback) {
        callback(null);
      }
      on() {}
    };
  };
});

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
