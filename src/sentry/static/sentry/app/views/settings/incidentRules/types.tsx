export enum AlertRuleThreshold {
  INCIDENT,
  RESOLUTION,
}

export enum AlertRuleThresholdType {
  ABOVE,
  BELOW,
}

export enum Dataset {
  ERRORS = 'events',
  TRANSACTIONS = 'transactions',
}

export type UnsavedTrigger = {
  // UnsavedTrigger can be apart of an Unsaved Alert Rule that does not have an
  // id yet
  alertRuleId?: string;
  label: string;
  alertThreshold: number | '' | null;
  actions: Action[];
};

export type ThresholdControlValue = {
  thresholdType: AlertRuleThresholdType;
  /**
   * Resolve threshold is optional, so it can be null
   */
  threshold: number | '' | null;
};

export type SavedTrigger = Omit<UnsavedTrigger, 'actions'> & {
  id: string;
  dateCreated: string;
  actions: Action[];
};

export type Trigger = Partial<SavedTrigger> & UnsavedTrigger;

export type UnsavedIncidentRule = {
  dataset: Dataset;
  projects: string[];
  environment: string | null;
  query: string;
  timeWindow: number;
  triggers: Trigger[];
  aggregate: string;
  thresholdType: AlertRuleThresholdType;
  resolveThreshold: number | '' | null;
};

export type SavedIncidentRule = UnsavedIncidentRule & {
  dateCreated: string;
  dateModified: string;
  id: string;
  status: number;
  name: string;
};

export type IncidentRule = Partial<SavedIncidentRule> & UnsavedIncidentRule;

export enum TimeWindow {
  ONE_MINUTE = 1,
  FIVE_MINUTES = 5,
  TEN_MINUTES = 10,
  FIFTEEN_MINUTES = 15,
  THIRTY_MINUTES = 30,
  ONE_HOUR = 60,
  TWO_HOURS = 120,
  FOUR_HOURS = 240,
  ONE_DAY = 1440,
}

export type ProjectSelectOption = {
  label: string;
  value: number;
};

export enum ActionType {
  EMAIL = 'email',
  SLACK = 'slack',
  PAGERDUTY = 'pagerduty',
  MSTEAMS = 'msteams',
  SENTRY_APP = 'sentry_app',
}

export enum TargetType {
  // The name can be customized for each integration. Email for email, channel for Slack, service for PagerDuty). We probably won't support this for email at first, since we need to be careful not to enable spam
  SPECIFIC = 'specific',

  // Just works with email for now, grabs given user's email address
  USER = 'user',

  // Just works with email for now, grabs the emails for all team members
  TEAM = 'team',
}

/**
 * This is an available action template that is associated to a Trigger in a Metric Alert Rule
 */
export type MetricActionTemplate = {
  /**
   * The integration type e.g. 'email'
   */
  type: ActionType;

  /**
   * See `TargetType`
   */
  allowedTargetTypes: TargetType[];

  /**
   * Name of the integration. This is a text field that differentiates integrations from the same provider from each other
   */
  integrationName: string;

  /**
   * Integration id for this `type`, should be passed to backend as `integrationId` when creating an action
   */
  integrationId: number;

  /**
   * Name of the SentryApp. Like `integrationName`, this differentiates SentryApps from each other.
   */
  sentryAppName: string;

  /**
   * SentryApp id for this `type`, should be passed to backend as `sentryAppId` when creating an action.
   */
  sentryAppId: number;

  /**
   * For some available actions, we pass in the list of available targets.
   */
  options: Array<{label: string; value: any}> | null;

  /**
   * If this is a `sentry_app` action, this is the Sentry App's status.
   */
  status?: 'unpublished' | 'published' | 'internal';
};

/**
 * This is the user's configured action
 */
export type Action = UnsavedAction & Partial<SavedActionFields>;
export type SavedAction = UnsavedAction & SavedActionFields;

type SavedActionFields = {
  /**
   * The id of the alert rule this action belongs to
   */
  alertRuleTriggerId: string;

  /**
   * A human readable description of the action generated by server
   */
  desc: string;

  /**
   * model id of the action
   */
  id: string;

  /**
   * date created
   */
  dateCreated: string;
};

export type UnsavedAction = {
  type: ActionType;

  targetType: TargetType | null;

  /**
   * How to identify the target. Can be email, slack channel, pagerduty service,
   * user_id, team_id, SentryApp id, etc
   */
  targetIdentifier: string | null;

  /**
   * The id of the integration, can be null (e.g. email) or undefined (server errors when posting w/ null value)
   */
  integrationId?: number | null;

  /**
   * The id of the SentryApp, can be null (e.g. email) or undefined (server errors when posting w/ null value)
   */
  sentryAppId?: number | null;

  /**
   * For some available actions, we pass in the list of available targets.
   */
  options: Array<{label: string; value: any}> | null;

  /**
   * If this is a `sentry_app` action, this is the Sentry App's status.
   */
  status?: 'unpublished' | 'published' | 'internal';
};
