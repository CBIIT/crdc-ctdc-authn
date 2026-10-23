const request = require('supertest');
const express = require('express');

jest.mock('../../services/session', () => ({
    createSession: jest.fn(() => (req, _res, next) => {
        req.sessionID = 'test-session-id';
        req.session = {};
        next();
    })
}));

const authRouter = require('../../routes/auth');

describe('POST /api/auth/refresh', () => {
    test('returns 404 because refresh endpoint is not registered', async () => {
        const app = express();
        app.use(express.json());
        app.use('/api/auth', authRouter);

        await request(app)
            .post('/api/auth/refresh')
            .send({ session_id: 'test-session' })
            .expect(404);
    });
});
