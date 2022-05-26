const JUDGE_STATUS = {
  AC: 'Accepted',
  WA: 'Wrong Answer',
  ONF: 'Output Not Found',
  RE: 'Runtime Error',
  TLE: 'Time Limit Excceded',
  UE: 'Unknown Error',
  CE: 'Compilation Error'
} as const;

export type JudgeStatus = typeof JUDGE_STATUS[keyof typeof JUDGE_STATUS]
