jest.mock('mysql2', () => ({
  createPool: jest.fn(() => ({
    getConnection: jest.fn(),
    query: jest.fn()
  }))
}));

jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => ({
    query: jest.fn()
  }))
}));

const mockStoreCtor = jest.fn();
const mockExpressMysqlSessionFactory = jest.fn(() => mockStoreCtor);

jest.mock('express-mysql-session', () => mockExpressMysqlSessionFactory);
jest.mock('express-session', () => jest.fn(() => jest.fn()));

describe('MySQL pool option compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  test('services/mysql-connection does not pass removed pool options', () => {
    const mysql2 = require('mysql2');
    require('../../services/mysql-connection');

    expect(mysql2.createPool).toHaveBeenCalledTimes(1);
    const poolOptions = mysql2.createPool.mock.calls[0][0];
    expect(poolOptions).not.toHaveProperty('acquireTimeout');
    expect(poolOptions).not.toHaveProperty('timeout');
  });

  test('services/mySQL/mySQL-operations does not pass removed pool options', () => {
    const mysql2 = require('mysql2');
    require('../../services/mySQL/mySQL-operations');

    expect(mysql2.createPool).toHaveBeenCalledTimes(1);
    const poolOptions = mysql2.createPool.mock.calls[0][0];
    expect(poolOptions).not.toHaveProperty('acquireTimeout');
    expect(poolOptions).not.toHaveProperty('timeout');
  });

  test('services/session uses mysql2/promise pool without session-store-only options', () => {
    const mysql2Promise = require('mysql2/promise');
    const { createSession } = require('../../services/session');

    createSession({ sessionSecret: 'secret', session_timeout: 60000 });

    expect(mysql2Promise.createPool).toHaveBeenCalledTimes(1);
    const poolOptions = mysql2Promise.createPool.mock.calls[0][0];
    expect(poolOptions).not.toHaveProperty('checkExpirationInterval');
    expect(poolOptions).not.toHaveProperty('expiration');

    expect(mockStoreCtor).toHaveBeenCalledTimes(1);
    const storeOptions = mockStoreCtor.mock.calls[0][0];
    expect(storeOptions).toHaveProperty('checkExpirationInterval', 10 * 1000);
    expect(storeOptions).toHaveProperty('expiration', 60000);
  });
});
