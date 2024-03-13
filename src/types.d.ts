import { AppLoadContext, SessionData } from "@remix-run/server-runtime";

export type KindeUser = {
  family_name: string | null;
  given_name: string | null;
  picture: string | null;
  email: string;
  id: string;
};

export interface Context extends AppLoadContext {
  env: {
    KINDE_ISSUER_URL: string;
    KINDE_CLIENT_ID: string;
    KINDE_CLIENT_SECRET: string;
    KINDE_CALLBACK_URL: string;
    KINDE_POST_LOGOUT_REDIRECT_URL: string;
    KINDE_POST_LOGIN_REDIRECT_URL: string;
    KINDE_AUDIENCE: string;
  };
  sessionStorage: SessionData;
}

export type FlagDataTypeMap = {
  [key: string]: string;
};

export type KindeAccessToken = {
  aud: string[];
  azp: string;
  billing: {
    has_payment_details: boolean;
    org_entitlements: any[] | null;
    plan: {
      code: string | null;
      created_on: number | null;
      has_trial_period: boolean | null;
      invoice_due_on: number | null;
      name: string | null;
      plan_charge_type: number | null;
      trial_expires_on: number | null;
    };
  };
  exp: number;
  feature_flgs: {
    [key: string]: {
      t: "i" | "b" | "s";
      v: string | boolean | number;
    };
  };
  iat: number;
  iss: string;
  jti: string;
  org_code: string;
  permissions: string[];
  scp: string[];
  sub: string;
};

export type KindeIdToken = {
  at_hash: string;
  aud: string[];
  auth_time: number;
  azp: string;
  email: string;
  exp: number;
  family_name: string;
  given_name: string;
  iat: number;
  iss: string;
  jti: string;
  name: string;
  org_codes: string[];
  picture: string;
  sub: string;
  updated_at: number;
};

export type KindePermission = { isGranted: boolean; orgCode: string | null };
