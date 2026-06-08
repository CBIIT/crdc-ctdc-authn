jest.mock('../../services/ras-auth', () => ({
    getRASTokenBundle: jest.fn(),
    refreshRASTokenBundle: jest.fn(),
    rasUserInfo: jest.fn(),
    validateRASPassport: jest.fn()
}));

const {
    getRASTokenBundle,
    refreshRASTokenBundle,
    rasUserInfo,
    validateRASPassport
} = require('../../services/ras-auth');

const rasClient = require('../../idps/ras');

describe('RAS IDP client', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('login returns user with raw token shape', async () => {
        getRASTokenBundle.mockResolvedValue({
            access_token: 'a',
            refresh_token: 'r',
            id_token: 'i',
            token_type: 'Bearer',
            scope: 'openid ga4gh_passport_v1',
            expires_in: 1800
        });
        rasUserInfo.mockResolvedValue({
            email: 'u@example.org',
            first_name: 'U',
            last_name: 'One',
            passport_jwt_v11: 'p.jwt'
        });
        validateRASPassport.mockResolvedValue(true);

        const result = await rasClient.login('code', 'redirect');

        expect(result.email).toBe('u@example.org');
        expect(result.tokens.access_token).toBe('a');
        expect(result.userInfo.passport_jwt_v11).toBe('p.jwt');
    });

    test('authenticated returns true when token is valid', async () => {
        rasUserInfo.mockResolvedValueOnce({ email: 'u@example.org', passport_jwt_v11: 'p.jwt' });
        validateRASPassport.mockResolvedValue(true);

        const stateTokens = { access_token: 'old', refresh_token: 'r1' };
        const result = await rasClient.authenticated(stateTokens);

        expect(result).toBe(true);
        expect(refreshRASTokenBundle).not.toHaveBeenCalled();
    });
});
