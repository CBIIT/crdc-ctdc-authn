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
      on() {} // Mock event listener
    };
  };
});

jest.mock("../idps/nih");
jest.mock("../idps/google");
jest.mock("../services/nih-auth");
jest.mock("../neo4j/event-service");

const app = require("../app");
const request = require("supertest");
const { NIH, LOGIN_GOV, GOOGLE } = require("../constants/idp-constants");

describe("GET /auth test", () => {
  const LOGOUT_ROUTE = "/api/auth/logout";
  const LOGIN_ROUTE = "/api/auth/login";

  const createMockLoginResult = (idp) => ({
    name: "Test",
    lastName: "User",
    tokens: "token123",
    email: "test@example.com",
    idp: idp,
  });

  beforeAll(() => {
    // Mock event service methods
    const EventService = require("../neo4j/event-service").EventService;
    EventService.prototype.storeLoginEvent = jest
      .fn()
      .mockResolvedValue("completed");
    EventService.prototype.storeLogoutEvent = jest
      .fn()
      .mockResolvedValue("completed");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Give time for connections to close
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  test(`auth nih login called once`, async () => {
    const nihClient = require("../idps/nih");
    nihClient.login.mockReturnValue(
      Promise.resolve(createMockLoginResult(NIH))
    );
    await request(app)
      .post(LOGIN_ROUTE)
      .send({ code: "code", IDP: NIH })
      .expect(200);
    expect(nihClient.login).toHaveBeenCalledTimes(1);
  }, 10000);

  test(`auth google login called once`, async () => {
    const googleClient = require("../idps/google");
    googleClient.login.mockReturnValue(
      Promise.resolve(createMockLoginResult(GOOGLE))
    );
    await request(app)
      .post(LOGIN_ROUTE)
      .send({ code: "code", IDP: GOOGLE })
      .expect(200);
    expect(googleClient.login).toHaveBeenCalledTimes(1);
  }, 10000);

  test(`auth login.gov login called once`, async () => {
    // login.gov uses the NIH client in the implementation
    const nihClient = require("../idps/nih");
    nihClient.login.mockReturnValue(
      Promise.resolve(createMockLoginResult(LOGIN_GOV))
    );
    await request(app)
      .post(LOGIN_ROUTE)
      .send({ code: "code", IDP: LOGIN_GOV })
      .expect(200);
    expect(nihClient.login).toHaveBeenCalledTimes(1);
  }, 10000);

  test(`auth logout nih`, async () => {
    const nihClient = require("../idps/nih");
    nihClient.logout.mockReturnValue(Promise.resolve());
    await request(app).post(LOGOUT_ROUTE).send({ IDP: NIH }).expect(200);
    expect(nihClient.logout).toHaveBeenCalledTimes(1);
  }, 10000);

  test(`auth logout login.gov`, async () => {
    const nihClient = require("../idps/nih");
    nihClient.logout.mockReturnValue(Promise.resolve());
    await request(app).post(LOGOUT_ROUTE).send({ IDP: LOGIN_GOV }).expect(200);
    expect(nihClient.logout).toHaveBeenCalledTimes(1);
  }, 10000);
});
