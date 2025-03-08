export enum ProviderType {
  LINKEDIN = 0,
}

export enum ProviderStatus {
  CREATION_SUCCESS = 0,
  RECONNECTED = 1,
}

export enum WorkflowType {
  LEAD_LIST = 0, // lead list表示用
  SEARCH = 1,
  INVITE = 2,
}

export enum ActiveTab {
  SEARCH = 0,
  KEYWORDS = 1,
  LEAD_LIST = 2,
  FILE_URL = 3,
  UPLOAD = 4,
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
  IN_QUEUE = 10,
  INVITED_FAILED = 20,
  INVITED = 21,
  ACCEPTED = 30,
  FOLLOW_UP_SENT_FAILED = 40,
  FOLLOW_UP_SENT = 41,
  REPLIED = 50,
}
