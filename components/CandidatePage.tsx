import React, { useState, useEffect, useRef } from 'react';
import { useAuth, useData } from '../App';
import { Job, Submission, Trial, TrialType, MCQTrial, Answer, FileAnswer, CodingExerciseTrial, DeliverableTrial } from '../types';
import { ClockIcon } from './icons';

type View = 'list' | 'contest';

export default function CandidatePage() {
  const [view, setView] = useState<View>('list');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  
  const handleStartContest = (job: Job) => {
    setSelectedJob(job);
    setView('contest');
  };
  
  const handleFinishContest = () => {
    setSelectedJob(null);
    setView('list');
  };

  const renderView = () => {
    switch (view) {
      case 'contest':
        return <ContestView job={selectedJob!} onFinish={handleFinishContest} />;
      case 'list':
      default:
        return <JobList onStartContest={handleStartContest} />;
    }
  };

  return <div>{renderView()}</div>;
}

// --- Sub-components for CandidatePage ---

const JobList = ({ onStartContest }: { onStartContest: (job: Job) => void; }) => {
  const { jobs, submissions } = useData();
  const { currentUser } = useAuth();

  const submittedJobIds = new Set(
    submissions.filter(s => s.candidateId === currentUser!.id).map(s => s.jobId)
  );

  const now = new Date();
  const availableJobs = jobs.filter(job => {
    const startDate = new Date(job.startDate);
    const endDate = new Date(job.endDate);
    return startDate <= now && now <= endDate;
  });

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Available Job Contests</h2>
      {availableJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableJobs.map(job => (
            <div key={job.id} className="p-6 border border-gray-200 rounded-lg flex flex-col justify-between bg-gray-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{job.title}</h3>
                <p className="text-sm font-medium text-cyan-600 mb-2">{job.companyName}</p>
                <p className="text-sm text-gray-600 line-clamp-3">{job.description}</p>
              </div>
              <div className="mt-4">
                 {job.contestDurationMinutes > 0 && 
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <ClockIcon className="w-4 h-4"/> 
                        <span>{job.contestDurationMinutes} minute time limit</span>
                    </div>
                 }
                <button
                    onClick={() => onStartContest(job)}
                    disabled={submittedJobIds.has(job.id)}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {submittedJobIds.has(job.id) ? 'Completed' : 'Start Contest'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-10">No job contests are available at the moment.</p>
      )}
    </div>
  );
};


const ContestView = ({ job, onFinish }: { job: Job; onFinish: () => void; }) => {
  const [answers, setAnswers] = useState<{[trialId: string]: string | number | FileAnswer}>({});
  const [submissionResult, setSubmissionResult] = useState<{ score: number; total: number } | null>(null);
  const { currentUser } = useAuth();
  const { setSubmissions } = useData();
  
  const [startTime] = useState(Date.now());
  const [remainingSeconds, setRemainingSeconds] = useState(job.contestDurationMinutes > 0 ? job.contestDurationMinutes * 60 : -1);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (remainingSeconds === -1) return; // No timer

    if (remainingSeconds === 0) {
        if(formRef.current) {
            // Use a synthetic event to submit
            const event = new Event('submit', { bubbles: true, cancelable: true });
            formRef.current.dispatchEvent(event);
        }
    }

    const timer = setInterval(() => {
        setRemainingSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  const handleAnswerChange = (trialId: string, value: string | number | FileAnswer) => {
    setAnswers(prev => ({ ...prev, [trialId]: value }));
  };
  
  const handleFileChange = (trialId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        if (event.target?.result) {
            const fileAnswer: FileAnswer = {
                fileName: file.name,
                dataUrl: event.target.result as string,
            };
            handleAnswerChange(trialId, fileAnswer);
        }
    };
    reader.readAsDataURL(file);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let score = 0;
    const mcqTrials = job.trials.filter((t): t is MCQTrial => t.type === TrialType.MCQ);
    
    mcqTrials.forEach(trial => {
        if(trial.correctAnswerIndex === answers[trial.id]) {
            score += trial.points;
        }
    });
    
    const total = mcqTrials.reduce((sum, trial) => sum + trial.points, 0);
    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
    
    const finalAnswers: Answer[] = Object.entries(answers).map(([trialId, value]) => ({
        trialId,
        value,
    }));

    const newSubmission: Submission = {
        id: `sub-${Date.now()}`,
        jobId: job.id,
        candidateId: currentUser!.id,
        answers: finalAnswers,
        score,
        total,
        submissionTime: Date.now(),
        durationSeconds,
    }

    setSubmissions(prev => [...prev, newSubmission]);
    setSubmissionResult({ score, total });
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }


  if (submissionResult) {
    return (
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Submission Complete!</h2>
            <p className="text-lg text-gray-600 mb-4">Thank you for participating in the contest for the <span className="font-semibold">{job.title}</span> position.</p>
            {submissionResult.total > 0 && (
                <div className="bg-cyan-50 p-6 rounded-lg my-6">
                    <p className="text-lg text-gray-700">Your Auto-Graded Score:</p>
                    <p className="text-5xl font-bold text-cyan-600">{submissionResult.score} <span className="text-3xl text-gray-500">/ {submissionResult.total}</span></p>
                </div>
            )}
            <p className="text-sm text-gray-500">The employer has received your full submission for review and will be in touch if you are a good fit.</p>
            <button
                onClick={onFinish}
                className="mt-8 px-8 py-3 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-700 transition-colors"
            >
                Back to Job List
            </button>
        </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto relative">
        {remainingSeconds !== -1 && (
            <div className="sticky top-4 z-10 mb-6 flex justify-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-lg font-bold shadow-lg ${remainingSeconds < 60 ? 'bg-red-100 text-red-700' : 'bg-gray-800 text-white'}`}>
                    <ClockIcon className="w-6 h-6" />
                    <span>{formatTime(remainingSeconds)}</span>
                </div>
            </div>
        )}

        <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-3xl font-bold text-gray-800">{job.title}</h2>
            <p className="text-lg text-gray-600">{job.companyName}</p>
            <p className="text-sm text-gray-500 mt-2">{job.description}</p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
            {job.trials.map((trial, index) => (
                <div key={trial.id} className="p-4 border-l-4 border-cyan-500 bg-gray-50 rounded-r-lg">
                    <p className="font-semibold text-gray-800 mb-4">{index + 1}. {trial.type === TrialType.MCQ ? trial.questionText : trial.prompt} <span className="text-sm font-normal text-gray-500">({trial.points} points)</span></p>
                    
                    {trial.type === TrialType.MCQ && (
                        <div className="space-y-2">
                            {trial.options.map((opt, oIndex) => (
                                <label key={oIndex} className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-200 cursor-pointer transition-colors">
                                    <input type="radio" name={`q-${trial.id}`} checked={answers[trial.id] === oIndex} onChange={() => handleAnswerChange(trial.id, oIndex)} className="w-4 h-4 text-cyan-600 border-gray-300 focus:ring-cyan-500" required/>
                                    <span className="text-gray-700">{opt}</span>
                                </label>
                            ))}
                        </div>
                    )}
                     {trial.type === TrialType.TEXT_RESPONSE && (
                        <textarea value={(answers[trial.id] as string) || ''} onChange={(e) => handleAnswerChange(trial.id, e.target.value)} rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Your answer..." required/>
                     )}
                     {trial.type === TrialType.CODING_EXERCISE && (
                        <textarea value={(answers[trial.id] as string) || ''} onChange={(e) => handleAnswerChange(trial.id, e.target.value)} rows={10} className="w-full px-3 py-2 font-mono text-sm bg-gray-900 text-green-300 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Your code or solution..." required/>
                     )}
                     {trial.type === TrialType.DELIVERABLE && (
                        <div>
                           <input type="file" onChange={(e) => handleFileChange(trial.id, e)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" required/>
                           {answers[trial.id] && <p className="text-sm text-green-600 mt-2">File selected: {(answers[trial.id] as FileAnswer).fileName}</p>}
                        </div>
                     )}
                </div>
            ))}

            <div className="flex justify-end pt-4">
                <button type="submit" className="px-8 py-3 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-700 transition-colors">
                    Submit Application
                </button>
            </div>
        </form>
    </div>
  );
};