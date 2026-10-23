const { UserService } = require('../../services/user-service');

describe('UserService current API behavior', () => {
    describe('getUserInfo', () => {
        test('returns null when session id is missing', async () => {
            const service = new UserService({ getSessionData: jest.fn() });
            await expect(service.getUserInfo()).resolves.toBeNull();
        });

        test('throws when session retrieval function is not configured', async () => {
            const service = new UserService({});
            await expect(service.getUserInfo('abc')).rejects.toThrow('Session retrieval service is not configured');
        });

        test('returns null when session data has no userInfo', async () => {
            const service = new UserService({
                getSessionData: jest.fn().mockResolvedValue({ tokens: {} })
            });

            await expect(service.getUserInfo('abc')).resolves.toBeNull();
        });

        test('returns userInfo when present', async () => {
            const userInfo = { email: 'user@example.com', IDP: 'ras' };
            const service = new UserService({
                getSessionData: jest.fn().mockResolvedValue({ userInfo })
            });

            await expect(service.getUserInfo('abc')).resolves.toEqual(userInfo);
        });
    });

    describe('getUserTokenUUIDs', () => {
        test('returns empty array for incomplete userInfo', () => {
            const service = new UserService({ getUserTokenUUIDs: jest.fn() });
            expect(service.getUserTokenUUIDs({ email: 'user@example.com' })).toEqual([]);
        });

        test('delegates to data service for valid userInfo', () => {
            const expected = ['uuid-1'];
            const dataService = { getUserTokenUUIDs: jest.fn().mockReturnValue(expected) };
            const service = new UserService(dataService);

            const result = service.getUserTokenUUIDs({ email: 'user@example.com', IDP: 'ras' });

            expect(result).toEqual(expected);
            expect(dataService.getUserTokenUUIDs).toHaveBeenCalledWith({
                email: 'user@example.com',
                IDP: 'ras'
            });
        });
    });
});
