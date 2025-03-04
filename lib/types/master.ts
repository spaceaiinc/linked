export enum WorkflowType {
  SEARCH = 0,
  INVITE = 1,
}

export enum ActiveTab {
  SEARCH = 0,
  KEYWORDS = 1,
  MYLIST = 2,
  FILE_URL = 3,
  UPLOAD = 4,
}

export enum NetworkDistance {
  OUT_OF_NETWORK = 0,
  FIRST_DEGREE = 1,
  SECOND_DEGREE = 2,
  THIRD_DEGREE = 3,
}

export enum WorkflowStatus {
  FAILED = 0,
  SUCCESS = 1,
}

export enum LeadStatus {
  SEARCHED = 0,
  IN_QUEUE = 1,
  INVITED = 2,
  ACCEPTED = 3,
  FOLLOW_UP_SENT = 4,
  REPLIED = 5,
  NOT_SENT = 6,
}
