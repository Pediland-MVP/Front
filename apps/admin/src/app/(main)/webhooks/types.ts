export type WebhookStatus = "active" | "disabled";

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  apiKeyPrefix: string;
  status: WebhookStatus;
  consecutiveFailures: number;
  autoDisabledAt: string | null;
  autoDisableReason: string | null;
  createdByAdminId: string | null;
  createDate: string;
  updateDate: string;
  subscriptionCount?: number;
}

export interface WebhookSubscription {
  id: string;
  endpointId: string;
  pattern: string;
}

export interface WebhookDetail extends WebhookEndpoint {
  subscriptions: WebhookSubscription[];
}

export interface CreateWebhookResult {
  id: string;
  apiKey: string;
  signingSecret: string;
  apiKeyPrefix: string;
}

/** Revealed-once secrets shown by create / rotate flows. */
export interface RevealedSecrets {
  apiKey?: string;
  signingSecret?: string;
}
