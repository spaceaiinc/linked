export enum ProviderType {
  LINKEDIN = 0,
}

export enum ProviderStatus {
  CREATION_SUCCESS = 0,
  RECONNECTED = 1,
}

export enum WorkflowType {
  LEAD_LIST = 0, // lead list表示用
  SEARCH_PROFILE = 1,
  INVITE = 2,
  SEND_MESSAGE = 3,
}

export enum ActiveTab {
  SEARCH = 0,
  KEYWORDS = 1,
  LEAD_LIST = 2,
  FILE_URL = 3,
  UPLOAD = 4,
  SEARCH_REACTION = 5,
}

export enum NetworkDistance {
  OUT_OF_NETWORK = 0,
  FIRST_DEGREE = 1,
  SECOND_DEGREE = 2,
  THIRD_DEGREE = 3,
}

export enum WorkflowRunStatus {
  OFF = 0,
  ON = 1,
}
export enum WorkflowStatus {
  FAILED = 0,
  SUCCESS = 1,
}

export enum LeadStatus {
  SEARCHED = 0,
  INVITED_FAILED = 1,
  IN_QUEUE = 10,
  ALREADY_INVITED = 11,
  INVITED = 20,
  ACCEPTED = 30,
  FOLLOW_UP_SENT_FAILED = 31,
  FOLLOW_UP_SENT = 40,
  REPLIED = 50,
}

export enum ReactionType {
  LIKE = 0,
  COMMENT = 1,
  EMPATHY = 2,
  ENTERTAINMENT = 3,
  INTEREST = 4,
  PRAISE = 5,
  APPRECIATION = 6,
}

export enum MessageTriggerType {
  ALWAYS_SEND = 0,
  SEND_IF_FIRST = 1,
  SEND_IF_LAST_SENDER_IS_SELF = 2,
  SEND_IF_NO_REPLY = 3,
}
