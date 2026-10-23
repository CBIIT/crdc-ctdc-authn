const nodeFetch = require('node-fetch');

jest.mock('node-fetch');

const {
    getRASTokenBundle,
    refreshRASTokenBundle,
    rasUserInfo,
    validateRASPassport
} = require('../../services/ras-auth');

describe('RAS auth service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getRASTokenBundle returns raw token payload', async () => {
        nodeFetch.mockResolvedValue({
            status: 200,
            json: async () => ({
                access_token: 'a',
                refresh_token: 'r',
                id_token: 'i',
                token_type: 'Bearer',
                scope: 'openid ga4gh_passport_v1',
                expires_in: 1800
            })
        });

        const tokenBundle = await getRASTokenBundle('code', 'https://redirect');

        expect(tokenBundle.access_token).toBe('a');
        expect(tokenBundle.refresh_token).toBe('r');
        expect(tokenBundle.id_token).toBe('i');
        expect(tokenBundle.token_type).toBe('Bearer');
        expect(tokenBundle.expires_in).toBe(1800);
    });

    test('refreshRASTokenBundle currently throws due missing normalizer', async () => {
        nodeFetch.mockResolvedValue({
            status: 200,
            json: async () => ({
                access_token: 'a2',
                refresh_token: 'r2',
                id_token: 'i2',
                token_type: 'Bearer',
                scope: 'openid ga4gh_passport_v1',
                expires_in: 1800
            })
        });

        await expect(refreshRASTokenBundle('refresh-token')).rejects.toThrow('normalizeTokenResponse is not defined');
    });

    test('rasUserInfo returns JSON payload', async () => {
        nodeFetch.mockResolvedValue({
            status: 200,
            json: async () => ({ email: 'u@example.org' })
        });

        const payload = await rasUserInfo('access');

        expect(payload.email).toBe('u@example.org');
    });

    test('validateRASPassport returns true for Valid response', async () => {
        nodeFetch.mockResolvedValue({ status: 200, text: async () => 'Valid' });

        await expect(validateRASPassport('passport.jwt')).resolves.toBe(true);
    });
});
