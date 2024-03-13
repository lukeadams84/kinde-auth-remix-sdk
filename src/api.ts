import {
  APIsApi,
  ApplicationsApi,
  BusinessApi,
  CallbacksApi,
  Configuration,
  ConnectedAppsApi,
  EnvironmentsApi,
  FeatureFlagsApi,
  IndustriesApi,
  OAuthApi,
  OrganizationsApi,
  PermissionsApi,
  RolesApi,
  SubscribersApi,
  TimezonesApi,
  UsersApi,
} from "@kinde-oss/kinde-typescript-sdk";
import { isTokenValid } from "./utils/is-token-valid";
import { SessionData } from "@remix-run/server-runtime";
import { Context } from "./types";

export const createKindeApiClient = async ({
  req,
  context,
}: {
  req: Request;
  context: Context;
}) => {
  let apiToken = null;
  const cookie = req.headers.get("Cookie");
  const session = (await context.sessionStorage.getSession(
    cookie
  )) as SessionData;

  const sessionManager = {
    async getSessionItem(key: string) {
      return await session.get(key);
    },
    async setSessionItem(key: string, value: any) {
      return await session.set(key, value);
    },
    async removeSessionItem(key: any) {
      return await session.unset(key);
    },
    async destroySession() {
      return await context.sessionStorage.destroySession(session);
    },
  };

  const tokenFromCookie = await sessionManager.getSessionItem(
    "kinde_api_access_token"
  );

  if (isTokenValid(tokenFromCookie, context)) {
    apiToken = tokenFromCookie;
  } else {
    const response = await fetch(
      `${context.env.KINDE_ISSUER_URL}/oauth2/token`,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: context.env.KINDE_CLIENT_ID || "",
          client_secret: context.env.KINDE_CLIENT_SECRET || "",
          audience: "",
        }),
      }
    );
    apiToken = (await response.json()).access_token;
    try {
      await sessionManager.setSessionItem("kinde_api_access_token", apiToken);
    } catch (error) {
      console.error(error);
    }
  }

  const cfg = new Configuration({
    basePath: context.env.KINDE_ISSUER_URL,
    accessToken: apiToken,
    headers: { Accept: "application/json" },
  });

  const usersApi = new UsersApi(cfg);
  const oauthApi = new OAuthApi(cfg);
  const subscribersApi = new SubscribersApi(cfg);
  const organizationsApi = new OrganizationsApi(cfg);
  const connectedAppsApi = new ConnectedAppsApi(cfg);
  const featureFlagsApi = new FeatureFlagsApi(cfg);
  const environmentsApi = new EnvironmentsApi(cfg);
  const permissionsApi = new PermissionsApi(cfg);
  const rolesApi = new RolesApi(cfg);
  const businessApi = new BusinessApi(cfg);
  const industriesApi = new IndustriesApi(cfg);
  const timezonesApi = new TimezonesApi(cfg);
  const applicationsApi = new ApplicationsApi(cfg);
  const callbacksApi = new CallbacksApi(cfg);
  const apisApi = new APIsApi(cfg);

  return {
    usersApi,
    oauthApi,
    subscribersApi,
    organizationsApi,
    connectedAppsApi,
    featureFlagsApi,
    environmentsApi,
    permissionsApi,
    rolesApi,
    businessApi,
    industriesApi,
    timezonesApi,
    applicationsApi,
    callbacksApi,
    apisApi,
  };
};
