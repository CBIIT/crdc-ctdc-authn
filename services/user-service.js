
class UserService{
    constructor(dataService) {
        this.dataService = dataService;
    }

    getUserTokenUUIDs(userInfo) {
        if (!userInfo?.email || !userInfo?.IDP) {
            return [];
        }
        if (typeof this.dataService.getUserTokenUUIDs !== 'function') {
            return [];
        }
        return this.dataService.getUserTokenUUIDs({
            email: userInfo.email,
            IDP: userInfo.IDP
        });
    }

    async persistUserPassportJWT({ email, IDP, passportJWT }) {
        if (!email || !IDP || !passportJWT) {
            throw new Error('persistUserPassportJWT requires email, IDP, and passportJWT');
        }
        if (typeof this.dataService.upsertUserPassportJWT !== 'function') {
            throw new Error('Passport persistence data method is not configured');
        }

        return this.dataService.upsertUserPassportJWT({
            email,
            idp: IDP,
            passportJWT
        });
    }

    async getUserInfo(sessionId) {
        if (!sessionId) {
            return null;
        }
        if (typeof this.dataService.getSessionData !== 'function') {
            throw new Error('Session retrieval service is not configured');
        }

        try {
            // Get session data to extract email and IDP
            const sessionData = await this.dataService.getSessionData(sessionId);
            
            if (!sessionData || !sessionData.userInfo) {
                return null;
            }
          
            return sessionData.userInfo;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = {
    UserService
};
