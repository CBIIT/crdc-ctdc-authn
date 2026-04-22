const app = require('../app');
const request = require('supertest');
const {NIH, LOGIN_GOV, GOOGLE, RAS} = require("../constants/idp-constants");
const nihClient = require("../idps/nih");
jest.mock("../idps/nih");
jest.mock("../idps/google");
jest.mock("../idps/ras");
jest.mock("../services/nih-auth");
describe('GET /auth test', ()=> {
    const LOGOUT_ROUTE = '/api/auth/logout';
    const LOGIN_ROUTE = '/api/auth/login';
    const mockLoginResult = { name: '', tokens: '', email: '', idp: '' };

    afterEach(() => {
        jest.clearAllMocks();
    });
    test(`auth nih login called once`, async () => {
        const nihClient = require('../idps/nih');
        nihClient.login.mockReturnValue(Promise.resolve(mockLoginResult));
        await request(app)
            .post(LOGIN_ROUTE)
            .send({code: 'code', IDP: NIH})
            .expect(200);
        expect(nihClient.login).toBeCalledTimes(1);
    });

    test(`auth nih login called once`, async () => {
        const googleClient = require('../idps/google');
        nihClient.login.mockReturnValue(Promise.resolve(mockLoginResult));
        await request(app)
            .post(LOGIN_ROUTE)
            .send({code: 'code', IDP: GOOGLE})
            .expect(200);
        expect(googleClient.login).toBeCalledTimes(1);
    });


    test(`auth nih login called once`, async () => {
        const nihClient = require('../idps/nih');
        nihClient.login.mockReturnValue(Promise.resolve(mockLoginResult));
        await request(app)
            .post(LOGIN_ROUTE)
            .send({code: 'code', IDP: LOGIN_GOV})
            .expect(200);
        expect(nihClient.login).toBeCalledTimes(1);
    });

    test(`auth logout nih`, async () => {
        const nihClient = require('../idps/nih');
        nihClient.logout.mockReturnValue(Promise.resolve());
        await request(app)
            .post(LOGOUT_ROUTE)
            .send({IDP: NIH})
            .expect(200);
        expect(nihClient.logout).toBeCalledTimes(1);
    });

    test(`auth logout login.gov`, async () => {
        const nihClient = require('../idps/nih');
        nihClient.logout.mockReturnValue(Promise.resolve());
        await request(app)
            .post(LOGOUT_ROUTE)
            .send({IDP: LOGIN_GOV})
            .expect(200);
        expect(nihClient.logout).toBeCalledTimes(1);
    });

    test(`auth ras login called once`, async () => {
        const rasClient = require('../idps/ras');
        rasClient.login.mockReturnValue(Promise.resolve(mockLoginResult));
        await request(app)
            .post(LOGIN_ROUTE)
            .send({code: 'code', IDP: RAS})
            .expect(200);
        expect(rasClient.login).toBeCalledTimes(1);
    });
});
