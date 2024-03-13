import { jwtDecode } from "jwt-decode";
import { Context } from "../types";

const isTokenValid = (token: { access_token: any }, context: Context) => {
  const accessToken = token?.access_token || token;
  if (!accessToken) return false;

  const accessTokenHeader = jwtDecode(accessToken, { header: true });
  const accessTokenPayload = jwtDecode(accessToken);
  let isAudienceValid = true;
  if (context.env.KINDE_AUDIENCE)
    isAudienceValid =
      accessTokenPayload.aud &&
      accessTokenPayload.aud.includes(context.env.KINDE_AUDIENCE);

  if (
    accessTokenPayload.iss == context.env.KINDE_ISSUER_URL &&
    accessTokenHeader.alg == "RS256" &&
    accessTokenPayload.exp > Math.floor(Date.now() / 1000) &&
    isAudienceValid
  ) {
    return true;
  } else {
    return false;
  }
};

export { isTokenValid };
