import {
  GrantType,
  createKindeServerClient,
} from "@kinde-oss/kinde-typescript-sdk";
import {
  AppLoadContext,
  SessionData,
  redirect,
} from "@remix-run/server-runtime";

export interface Context extends AppLoadContext {
  env: {
    KINDE_ISSUER_URL: string;
    KINDE_CLIENT_ID: string;
    KINDE_CLIENT_SECRET: string;
    KINDE_CALLBACK_URL: string;
    KINDE_POST_LOGOUT_REDIRECT_URL: string;
  };
}

const createKindeClient = async ({ context }: { context: Context }) => {
  return createKindeServerClient(GrantType.AUTHORIZATION_CODE, {
    authDomain: context.env.KINDE_ISSUER_URL,
    clientId: context.env.KINDE_CLIENT_ID,
    clientSecret: context.env.KINDE_CLIENT_SECRET,
    redirectURL: context.env.KINDE_CALLBACK_URL,
    logoutRedirectURL: context.env.KINDE_POST_LOGOUT_REDIRECT_URL,
  });
};

export const handleAuth = async ({
  request,
  routeIndex,
  context,
}: {
  request: Request;
  routeIndex: string;
  context: AppLoadContext;
}) => {
  const kindeClient = await createKindeClient({ context });
  const cookie = request.headers.get("Cookie");
  const session = (await context.sessionStorage.getSession(
    cookie
  )) as SessionData;
  const sessionManager = {
    async getSessionItem(key: string) {
      return await session.get(key);
    },
    async setSessionItem(key: any, value: any) {
      return await session.set(key, value);
    },
    async removeSessionItem(key: string) {
      return await session.unset(key);
    },
    async destroySession() {
      return await context.sessionStorage.destroySession(session);
    },
  };

  const login = async () => {
    const authUrl = await kindeClient.login(sessionManager);
    const { searchParams } = new URL(request.url);
    const postLoginRedirecturl = searchParams.get("returnTo");

    if (postLoginRedirecturl) {
      await session.set("post_login_redirect_url", postLoginRedirecturl);
    }

    return redirect(authUrl.toString(), {
      headers: {
        "Set-Cookie": await context.sessionStorage.commitSession(session, {
          maxAge: 3600 * 3,
        }),
      },
    });
  };

  const register = async () => {
    const authUrl = await kindeClient.register(sessionManager);
    const { searchParams } = new URL(request.url);
    const postLoginRedirecturl = searchParams.get("returnTo");

    if (postLoginRedirecturl) {
      await session.set("post_login_redirect_url", postLoginRedirecturl);
    }

    return redirect(authUrl.toString(), {
      headers: {
        "Set-Cookie": await context.sessionStorage.commitSession(session, {
          maxAge: 3600 * 3,
        }),
      },
    });
  };

  const callback = async () => {
    await kindeClient.handleRedirectToApp(sessionManager, new URL(request.url));

    const postLoginRedirectURLFromMemory = await sessionManager.getSessionItem(
      "post_login_redirect_url"
    );

    if (postLoginRedirectURLFromMemory) {
      await sessionManager.removeSessionItem("post_login_redirect_url");
    }

    const postLoginRedirectURL =
      postLoginRedirectURLFromMemory ||
      context.env.KINDE_POST_LOGIN_REDIRECT_URL;

    return redirect(postLoginRedirectURL, {
      headers: {
        "Set-Cookie": await context.sessionStorage.commitSession(session, {
          maxAge: 3600 * 3,
        }),
      },
    });
  };

  const logout = async () => {
    const authUrl = await kindeClient.logout(sessionManager);

    return redirect(authUrl.toString(), {
      headers: {
        "Set-Cookie": await context.sessionStorage.destroySession(session),
      },
    });
  };

  switch (routeIndex) {
    case "login":
      return login();
    case "register":
      return register();
    case "callback":
      return callback();
    case "logout":
      return logout();
  }
};
