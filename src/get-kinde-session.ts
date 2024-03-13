import { SessionData } from "@remix-run/server-runtime";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { FlagDataTypeMap, Context } from "./types";

const flagDataTypeMap: FlagDataTypeMap = {
  s: "string",
  i: "integer",
  b: "boolean",
};

export const getKindeSession = async ({
  request,
  context,
}: {
  request: Request;
  context: Context;
}) => {
  const cookie = request.headers.get("Cookie");
  const session = (await context.sessionStorage.getSession(
    cookie
  )) as SessionData;

  const user = (await session.get("user")) || null;

  const idTokenRaw = (await session.get("id_token")) || null;

  let idToken: JwtPayload & { [key: string]: any[] } = {};
  try {
    idToken = jwtDecode(idTokenRaw);
  } catch (error) {}

  const accessTokenRaw = (await session.get("access_token")) || null;

  let accessToken: JwtPayload & { [key: string]: any[] } = {};
  try {
    accessToken = jwtDecode(accessTokenRaw);
  } catch (error) {}

  const getClaim = ({
    accessToken,
    idToken,
    claim,
    token = "accessToken",
  }: {
    accessToken?: JwtPayload;
    idToken?: JwtPayload;
    claim: string;
    token?: "accessToken" | "idToken";
  }) => {
    if (!idToken && !accessToken) {
      return null;
    }

    if (token === "accessToken") {
      return accessToken ? accessToken[claim] : null;
    } else if (token === "idToken") {
      return idToken ? idToken[claim] : null;
    } else {
      return null;
    }
  };

  const permissions = getClaim({ accessToken, claim: "permissions" }) || [];

  const userOrganizations = getClaim({
    idToken,
    claim: "org_codes",
    token: "idToken",
  });

  const organization = getClaim({ accessToken, claim: "org_code" });

  const getPermission = (permission: any) => {
    if (!permissions) return null;
    if (permissions.includes(permission)) {
      return {
        isGranted: true,
        orgCode: organization,
      };
    }
    return null;
  };

  const getFlag = (
    code: string | number,
    defaultValue: string | number | boolean,
    type: string
  ) => {
    const flags = getClaim({ accessToken, claim: "feature_flags" });
    const flag = flags?.[code] ? flags[code] : {};

    if (Object.keys(flag).length === 0 && defaultValue === undefined) {
      throw new Error(
        `Flag ${code} was not found, and no default value has been provided`
      );
    }

    if (type && flag.t && type !== flag.t) {
      throw Error(
        `Flag ${code} is of type ${
          flagDataTypeMap[flag.t as keyof typeof flagDataTypeMap]
        } - requested type ${flagDataTypeMap[type]}`
      );
    }

    return {
      code,
      type: flagDataTypeMap[flag.t || type],
      value: flag.v ?? defaultValue,
      is_default: flag.v == null,
      defaultValue,
    };
  };

  const getBooleanFlag = (code: string | number, defaultValue: any) => {
    try {
      const flag = getFlag(code, defaultValue, "b");
      return flag.value;
    } catch (err) {
      console.error(err);
    }
  };

  const getStringFlag = (code: string | number, defaultValue: any) => {
    try {
      const flag = getFlag(code, defaultValue, "s");
      return flag.value;
    } catch (err) {
      console.error(err);
    }
  };

  const getIntegerFlag = (code: string | number, defaultValue: any) => {
    try {
      const flag = getFlag(code, defaultValue, "i");
      return flag.value;
    } catch (err) {
      console.error(err);
    }
  };

  return {
    user,
    idToken,
    accessToken,
    idTokenRaw,
    accessTokenRaw,
    permissions,
    userOrganizations,
    organization,
    getPermission,
    getFlag,
    getStringFlag,
    getBooleanFlag,
    getIntegerFlag,
  };
};
