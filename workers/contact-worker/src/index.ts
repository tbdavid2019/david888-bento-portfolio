import {
  confirmContactSubmission,
  confirmedSignatures,
  corsHeaders,
  createConfirmationToken,
  handleContactHttpRequest,
  processConciergeChat,
  processContactSubmission,
  resolveConfirmOrigin,
  sanitizeSecretaryText,
  verifyConfirmationToken,
  type ConfirmationPayload,
  type ContactEnv,
  type ContactPayload,
} from '../../../lib/contact-core.ts';

export type Env = ContactEnv;
export type { ConfirmationPayload, ContactPayload };

export {
  confirmContactSubmission,
  confirmedSignatures,
  corsHeaders,
  createConfirmationToken,
  processConciergeChat,
  processContactSubmission,
  resolveConfirmOrigin,
  sanitizeSecretaryText,
  verifyConfirmationToken,
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleContactHttpRequest(request, env, true);
  },
};
