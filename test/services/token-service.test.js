const { TokenService } = require("../../services/token-service");
const { v4 } = require("uuid");
const { sign } = require("jsonwebtoken");

const tokenSecret = "secret";
const tokenTimeout = 60;

// Mock userService
const mockUserService = {
  getUserTokenUUIDs: jest.fn(),
};

const tokenService = new TokenService(tokenSecret, mockUserService);

describe("authenticate user token tests", () => {
  let token, userInfo, uuid;

  beforeEach(() => {
    uuid = v4();
    userInfo = {
      email: "placeholderEmail",
      IDP: "placeholderIDP",
      uuid: uuid,
    };
    // Reset mock before each test
    mockUserService.getUserTokenUUIDs.mockClear();
  });

  test("invalid token", async () => {
    mockUserService.getUserTokenUUIDs.mockResolvedValue([uuid]);
    token = createToken(userInfo, "secret2", tokenTimeout);
    await expect(
      tokenService.authenticateUserToken(token)
    ).resolves.toBeFalsy();
    mockUserService.getUserTokenUUIDs.mockResolvedValue([uuid]);
    await expect(
      tokenService.authenticateUserToken(undefined)
    ).resolves.toBeFalsy();
  });

  test("token uuid not in array", async () => {
    token = createToken(userInfo, tokenSecret, tokenTimeout);
    mockUserService.getUserTokenUUIDs.mockResolvedValue(["placeholderUUID"]);
    await expect(
      tokenService.authenticateUserToken(token)
    ).resolves.toBeFalsy();
    mockUserService.getUserTokenUUIDs.mockResolvedValue([]);
    await expect(
      tokenService.authenticateUserToken(token)
    ).resolves.toBeFalsy();
  });

  test("invalid or missing user info", async () => {
    token = createToken({}, tokenSecret, tokenTimeout);
    mockUserService.getUserTokenUUIDs.mockResolvedValue([uuid]);
    await expect(
      tokenService.authenticateUserToken(token)
    ).resolves.toBeFalsy();
  });

  test("valid token and uuid in array", async () => {
    token = createToken(userInfo, tokenSecret, tokenTimeout);
    mockUserService.getUserTokenUUIDs.mockResolvedValue([uuid]);
    await expect(
      tokenService.authenticateUserToken(token)
    ).resolves.toBeTruthy();
  });
});

function createToken(userInfo, token_secret, tokenTimeout) {
  return sign(userInfo, token_secret, { expiresIn: tokenTimeout });
}
