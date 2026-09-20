/** Browser-safe contracts. No provider or database imports. */
export type AssistantContext = {
  contactId: string;
  label: string;
  followUpId?: string;
};

export type ActionState = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELED" | "EXPIRED";
export type ActionReceipt = {
  id?: string;
  requestId?: string;
  status?: ActionState;
  summary: string;
  contactName?: string;
  details?: string[];
  changes?: Array<{ label: string; before: string; after: string }>;
  confirmLabel?: string;
  error?: string;
  entityType?: string;
  entityId?: string;
  link?: string;
  undoable: boolean;
  undoEntryId?: string;
  undoExpiresAt?: string;
  undoStatus?: "AVAILABLE" | "EXPIRED" | "UNDONE" | "CONFLICT" | "UNAVAILABLE";
};

export type ReadResult = {
  id: string;
  summary: string;
  readAt: string;
  items: Array<{ id: string; title: string; detail?: string; link?: string; context?: AssistantContext }>;
  ambiguous?: boolean;
};

export type Entry = {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: "voice" | "text" | "live";
  actions?: ActionReceipt[];
  results?: ReadResult[];
  createdAt?: string;
  requestId?: string;
  delivery?: "sending" | "sent" | "unknown";
};

export type ConversationSummary = {
  id: string;
  title: string;
  expiresAt: string;
  updatedAt: string;
  messageCount: number;
};

export type AssistantAccess = {
  userId: string;
  enabled: boolean;
  liveAvailable?: boolean;
  reason: string | null;
  priceLabel: string;
  billingConfigured: boolean;
  hasBillingAccount: boolean;
  monthlyRequests: number;
  monthlyRequestLimit: number;
  monthlyAudioSeconds: number;
  monthlyAudioSecondsLimit: number;
};
