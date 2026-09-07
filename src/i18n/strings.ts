import type { LangCode } from './languages';
import common from './translations/common';
import auth from './translations/auth';
import dashboard from './translations/dashboard';
import portal from './translations/portal';
import inspections from './translations/inspections';
import certificates from './translations/certificates';
import verify from './translations/verify';
import misc from './translations/misc';

export const strings: Record<string, Record<LangCode, string>> = {
  ...common,
  ...auth,
  ...dashboard,
  ...portal,
  ...inspections,
  ...certificates,
  ...verify,
  ...misc,
};