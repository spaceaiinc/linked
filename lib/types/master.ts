export enum WorkflowType {
  INVITE = 0,
  EXPORT = 1,
  INVITE_AND_EXPORT = 2,
}

export enum ActiveTab {
  SEARCH = 0,
  KEYWORDS = 1,
  MYLIST = 2,
  FILE_URL = 3,
  UPLOAD = 4,
}

export enum NetworkDistance {
  FIRST_DEGREE = 1,
  SECOND_DEGREE = 2,
  THIRD_DEGREE = 3,
  OUT_OF_NETWORK = 4,
}

export enum WorkflowStatus {
  FAILED = 0,
  SUCCESS = 1,
}

export enum LeadStatus {
  IN_QUEUE = 0,
  INVITED = 1,
  ACCEPTED = 2,
  FOLLOW_UP_SENT = 3,
  REPLIED = 4,
  NOT_SENT = 5,
}
