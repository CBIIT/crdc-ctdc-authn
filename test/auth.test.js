const request = require('supertest');
const { NIH, LOGIN_GOV, GOOGLE, RAS } = require('../constants/idp-constants');

jest.mock('newrelic', () => ({}), { virtual: true });
jest.mock('../bento-event-logging/const/format-constants', () => ({
  formatVariables: jest.fn((value) => value),
  formatMap: {}
}), { virtual: true });

jest.mock('../services/session', () => ({
  createSession: jest.fn(() => (req, res, next) => {
    let injectedSession = {};
    if (req.headers['x-test-session']) {
      try {
        injectedSession = JSON.parse(req.headers['x-test-session']);
      } catch (e) {
        injectedSession = {};
      }
    }

    req.session = {
      ...injectedSession,
      destroy: jest.fn((cb) => cb && cb())
    };
    req.sessionID = req.headers['x-test-session-id'] || 'mock-session-id';
    next();
  })
}));

jest.mock('../services/mysql-connection', () => ({
  getTTL: jest.fn((req, res) => res.json({ ttl: 0 })),
  getPing: jest.fn(),
  getVersion: jest.fn()
}));

jest.mock('../config', () => ({
  version: 'test-version',
  date: 'test-date',
  cookie_secret: 'test-secret',
  session_timeout: 1000,
  database_type: 'MYSQL',
  mysql_user: 'test-user',
  mysql_password: 'test-password',
  mysql_host: 'localhost',
  mysql_database: 'test-db',
  google: { CLIENT_ID: 'google-client-id' },
  nih: { CLIENT_ID: 'nih-client-id', REDIRECT_URL: 'http://localhost/nih' },
  noAutoLogin: true,
  getIdpOrDefault: (idp) => idp || 'GOOGLE',
  getUrlOrDefault: (_idp, url) => url
}));

jest.mock('../neo4j/event-service', () => ({
  EventService: jest.fn().mockImplementation(() => ({
    storeLoginEvent: jest.fn().mockResolvedValue('ok'),
    storeLogoutEvent: jest.fn().mockResolvedValue('ok')
  }))
}));

jest.mock('../services/clean-events.js', () => ({
  CleaningService: jest.fn(),
  checkTokenAndClean: jest.fn().mockResolvedValue('ok')
}));

jest.mock('../services/mySQL/mySQL-operations.js', () => ({
  mySQLOps: {
    getCreateCommand: jest.fn().mockResolvedValue('ok'),
    getEventAfterTimestamp: jest.fn().mockResolvedValue([]),
    compareSessionID: jest.fn().mockResolvedValue('mock-session-id'),
    getLastLogin: jest.fn().mockResolvedValue(null),
    clearEventsBeforeTimestamp: jest.fn().mockResolvedValue('ok'),
    getSessionData: jest.fn().mockResolvedValue(null)
  }
}));

jest.mock('../idps/nih');
jest.mock('../idps/google');
jest.mock('../idps/ras');
jest.mock('../services/nih-auth');
jest.mock('buffer-equal-constant-time', () => (a, b) => {
  if (!a || !b) return false;
  if (typeof a.equals === 'function') return a.equals(b);
  return a === b;
});
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock.jwt.token'),
  verify: jest.fn((token, secret, cb) => cb(null, { uuid: 'mock-uuid' })),
  decode: jest.fn(() => ({ uuid: 'mock-uuid' }))
}));

const app = require('../app');

describe('GET /auth test', () => {
  const LOGOUT_ROUTE = '/api/auth/logout';
  const LOGIN_ROUTE = '/api/auth/login';
  const AUTHENTICATED_ROUTE = '/api/auth/authenticated';
  const CLEANUP_ROUTE = '/api/auth/cleanUp';
  const USER_INFO_ROUTE = '/api/auth/userInfo';

  const createMockLoginResult = (idp) => ({
    name: 'Test',
    lastName: 'User',
    tokens: {},
    email: 'test@example.org',
    idp
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('auth nih login called once', async () => {
    const nihClient = require('../idps/nih');
    nihClient.login.mockResolvedValue(createMockLoginResult(NIH));

    await request(app)
      .post(LOGIN_ROUTE)
      .send({ code: 'code', IDP: NIH })
      .expect(200);

    expect(nihClient.login).toHaveBeenCalledTimes(1);
  });

  test('auth google login called once', async () => {
    const googleClient = require('../idps/google');
    googleClient.login.mockResolvedValue(createMockLoginResult(GOOGLE));

    await request(app)
      .post(LOGIN_ROUTE)
      .send({ code: 'code', IDP: GOOGLE })
      .expect(200);

    expect(googleClient.login).toHaveBeenCalledTimes(1);
  });

  test('auth login.gov login called once', async () => {
    const nihClient = require('../idps/nih');
    nihClient.login.mockResolvedValue(createMockLoginResult(LOGIN_GOV));

    await request(app)
      .post(LOGIN_ROUTE)
      .send({ code: 'code', IDP: LOGIN_GOV })
      .expect(200);

    expect(nihClient.login).toHaveBeenCalledTimes(1);
  });

  test('auth logout nih', async () => {
    const nihClient = require('../idps/nih');
    nihClient.logout.mockResolvedValue();

    await request(app)
      .post(LOGOUT_ROUTE)
      .send({ IDP: NIH })
      .expect(200);

    expect(nihClient.logout).toHaveBeenCalledTimes(1);
  });

  test('auth logout login.gov', async () => {
    const nihClient = require('../idps/nih');
    nihClient.logout.mockResolvedValue();

    await request(app)
      .post(LOGOUT_ROUTE)
      .send({ IDP: LOGIN_GOV })
      .expect(200);

    expect(nihClient.logout).toHaveBeenCalledTimes(1);
  });

  test('auth ras login called once', async () => {
    const rasClient = require('../idps/ras');
    rasClient.login.mockResolvedValue(createMockLoginResult(RAS));

    await request(app)
      .post(LOGIN_ROUTE)
      .send({ code: 'code', IDP: RAS })
      .expect(200);

    expect(rasClient.login).toHaveBeenCalledTimes(1);
  });

  test('auth login propagates provider statusCode', async () => {
    const nihClient = require('../idps/nih');
    nihClient.login.mockRejectedValue({ statusCode: 401, message: 'Unauthorized' });

    const response = await request(app)
      .post(LOGIN_ROUTE)
      .send({ code: 'code', IDP: NIH });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Unauthorized' });
  });

  test('authenticated returns false when session has no user/tokens', async () => {
    const response = await request(app)
      .post(AUTHENTICATED_ROUTE)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: false });
  });

  test('authenticated returns true when provider validates session', async () => {
    const nihClient = require('../idps/nih');
    nihClient.authenticated.mockResolvedValue(true);

    const response = await request(app)
      .post(AUTHENTICATED_ROUTE)
      .set('x-test-session', JSON.stringify({
        userInfo: { IDP: NIH },
        tokens: { accessToken: 'token' }
      }))
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: true });
    expect(nihClient.authenticated).toHaveBeenCalledTimes(1);
  });

  test('authenticated returns false when provider returns false', async () => {
    const nihClient = require('../idps/nih');
    nihClient.authenticated.mockResolvedValue(false);

    const response = await request(app)
      .post(AUTHENTICATED_ROUTE)
      .set('x-test-session', JSON.stringify({
        userInfo: { idp: NIH },
        tokens: { accessToken: 'token' }
      }))
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: false });
  });

  test('cleanup returns service status', async () => {
    const { checkTokenAndClean } = require('../services/clean-events.js');
    checkTokenAndClean.mockResolvedValueOnce('Database Wiped successfully');

    const response = await request(app)
      .post(CLEANUP_ROUTE)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'Database Wiped successfully' });
  });

  test('cleanup returns 500 when cleanup throws', async () => {
    const { checkTokenAndClean } = require('../services/clean-events.js');
    checkTokenAndClean.mockRejectedValueOnce(new Error('cleanup failed'));

    const response = await request(app)
      .post(CLEANUP_ROUTE)
      .send({});

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('errors');
  });

  test('userInfo returns 404 when session userInfo is not found', async () => {
    const response = await request(app)
      .get(USER_INFO_ROUTE)
      .set('x-test-session-id', 'missing-session');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'User info not found' });
  });

  test('userInfo returns 200 when session userInfo exists', async () => {
    const { mySQLOps } = require('../services/mySQL/mySQL-operations.js');
    const expectedUserInfo = { email: 'user@example.org', IDP: 'ras' };
    mySQLOps.getSessionData.mockResolvedValueOnce({ userInfo: expectedUserInfo });

    const response = await request(app)
      .get(USER_INFO_ROUTE)
      .set('x-test-session-id', 'existing-session');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userInfo: expectedUserInfo });
  });

  test('userInfo returns 500 when session data access fails', async () => {
    const { mySQLOps } = require('../services/mySQL/mySQL-operations.js');
    mySQLOps.getSessionData.mockRejectedValueOnce(new Error('db unavailable'));

    const response = await request(app)
      .get(USER_INFO_ROUTE)
      .set('x-test-session-id', 'error-session');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to retrieve userInfo' });
  });
});
