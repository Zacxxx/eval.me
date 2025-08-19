export enum UserRole {
  EMPLOYER = 'EMPLOYER',
  CANDIDATE = 'CANDIDATE',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  password?: string; // In a real app, this would be a hash
}

export enum TrialType {
  MCQ = 'MCQ',
  TEXT_RESPONSE = 'TEXT_RESPONSE',
  CODING_EXERCISE = 'CODING_EXERCISE',
  DELIVERABLE = 'DELIVERABLE',
}

interface BaseTrial {
  id: string;
  type: TrialType;
  points: number;
}

export interface MCQTrial extends BaseTrial {
  type: TrialType.MCQ;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface TextResponseTrial extends BaseTrial {
  type: TrialType.TEXT_RESPONSE;
  prompt: string;
}

export interface CodingExerciseTrial extends BaseTrial {
    type: TrialType.CODING_EXERCISE;
    prompt: string;
}

export interface DeliverableTrial extends BaseTrial {
    type: TrialType.DELIVERABLE;
    prompt: string;
}


export type Trial = MCQTrial | TextResponseTrial | CodingExerciseTrial | DeliverableTrial;


export interface Job {
  id:string;
  employerId: string;
  title: string;
  companyName: string;
  description: string;
  trials: Trial[];
  startDate: string; // ISO string for start date/time
  endDate: string; // ISO string for end date/time
  contestDurationMinutes: number; // 0 or less for no time limit
}

export interface FileAnswer {
    fileName: string;
    dataUrl: string;
}

export interface Answer {
    trialId: string;
    // value can be number for MCQ, string for text/code, or FileAnswer for deliverables
    value: number | string | FileAnswer; 
}

export interface Submission {
  id: string;
  jobId: string;
  candidateId: string;
  answers: Answer[];
  score: number; // Sum of points for correct auto-gradable answers
  total: number; // Sum of points for all auto-gradable trials
  submissionTime: number; // Timestamp of submission
  durationSeconds: number; // How long the candidate took
}