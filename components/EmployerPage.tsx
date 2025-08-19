import React, { useState } from 'react';
import { useAuth, useData } from '../App';
import { Job, Trial, MCQTrial, TextResponseTrial, Submission, TrialType, Answer, CodingExerciseTrial, DeliverableTrial, FileAnswer } from '../types';
import { suggestMCQTrial, suggestTextTrial, suggestCodingTrial, suggestDeliverableTrial } from '../services/geminiService';
import { PlusIcon, TrashIcon, SparklesIcon, ArrowPathIcon, DocumentTextIcon, CodeBracketIcon, ArrowUpTrayIcon, TrophyIcon } from './icons';

type View = 'list' | 'create' | 'results';

export default function EmployerPage() {
  const [view, setView] = useState<View>('list');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const renderView = () => {
    switch (view) {
      case 'create':
        return <JobCreator onBack={() => setView('list')} />;
      case 'results':
        return <ResultsView job={selectedJob!} onBack={() => { setView('list'); setSelectedJob(null); }} />;
      case 'list':
      default:
        return <JobList onSelectJob={(job) => { setSelectedJob(job); setView('results'); }} onCreate={() => setView('create')} />;
    }
  };

  return <div>{renderView()}</div>;
}

// --- Sub-components for EmployerPage ---

const JobList = ({ onSelectJob, onCreate }: { onSelectJob: (job: Job) => void; onCreate: () => void; }) => {
  const { currentUser } = useAuth();
  const { jobs, submissions } = useData();
  const myJobs = jobs.filter(j => j.employerId === currentUser!.id);

  const getSubmissionCount = (jobId: string) => {
    return submissions.filter(s => s.jobId === jobId).length;
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Your Job Postings</h2>
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Create New Job
        </button>
      </div>
      {myJobs.length > 0 ? (
        <div className="space-y-4">
          {myJobs.map(job => (
            <div key={job.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-700">{job.title}</h3>
                <p className="text-sm text-gray-500">{job.companyName} - {getSubmissionCount(job.id)} submissions</p>
              </div>
              <button
                onClick={() => onSelectJob(job)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                View Results
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-10">You haven't created any job contests yet.</p>
      )}
    </div>
  );
};

const JobCreator = ({ onBack }: { onBack: () => void; }) => {
  const { currentUser } = useAuth();
  const { setJobs } = useData();
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [trials, setTrials] = useState<Trial[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contestDurationMinutes, setContestDurationMinutes] = useState(0);

  const [isSuggesting, setIsSuggesting] = useState<number | null>(null);

  const handleAddTrial = (type: TrialType) => {
    if (trials.length >= 10) return; // Limit total trials
    const baseTrial = {
        id: `trial-${Date.now()}`,
        points: 10,
    };
    let newTrial: Trial;
    switch (type) {
        case TrialType.MCQ:
            newTrial = { ...baseTrial, type, questionText: '', options: ['', '', '', ''], correctAnswerIndex: 0 };
            break;
        case TrialType.TEXT_RESPONSE:
            newTrial = { ...baseTrial, type, prompt: '' };
            break;
        case TrialType.CODING_EXERCISE:
            newTrial = { ...baseTrial, type, prompt: '' };
            break;
        case TrialType.DELIVERABLE:
            newTrial = { ...baseTrial, type, prompt: '' };
            break;
        default:
            return;
    }
    setTrials([...trials, newTrial]);
  };
  
  const handleRemoveTrial = (id: string) => {
      setTrials(trials.filter(t => t.id !== id));
  }

  const handleTrialChange = (index: number, updatedTrial: Trial) => {
    const newTrials = [...trials];
    newTrials[index] = updatedTrial;
    setTrials(newTrials);
  };

  const handleSuggestTrial = async (index: number) => {
      if(!title.trim()) {
          alert("Please enter a job title first to get relevant suggestions.");
          return;
      }
      setIsSuggesting(index);
      const trial = trials[index];
      let suggestion;

      if (trial.type === TrialType.MCQ) {
        const existingQuestionTexts = trials.filter((t): t is MCQTrial => t.type === TrialType.MCQ).map(t => t.questionText).filter(Boolean);
        suggestion = await suggestMCQTrial(title, existingQuestionTexts);
      } else if (trial.type === TrialType.TEXT_RESPONSE) {
        const existingPrompts = trials.filter((t): t is TextResponseTrial => t.type === TrialType.TEXT_RESPONSE).map(t => t.prompt).filter(Boolean);
        suggestion = await suggestTextTrial(title, existingPrompts);
      } else if (trial.type === TrialType.CODING_EXERCISE) {
        const existingPrompts = trials.filter((t): t is CodingExerciseTrial => t.type === TrialType.CODING_EXERCISE).map(t => t.prompt).filter(Boolean);
        suggestion = await suggestCodingTrial(title, existingPrompts);
      } else if (trial.type === TrialType.DELIVERABLE) {
        const existingPrompts = trials.filter((t): t is DeliverableTrial => t.type === TrialType.DELIVERABLE).map(t => t.prompt).filter(Boolean);
        suggestion = await suggestDeliverableTrial(title, existingPrompts);
      }
      
      if (suggestion) {
          const newTrials = [...trials];
          newTrials[index] = { ...newTrials[index], ...suggestion };
          setTrials(newTrials);
      } else {
          alert("Could not generate a suggestion. Please try again.");
      }
      setIsSuggesting(null);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(endDate) <= new Date(startDate)) {
        alert("End date must be after the start date.");
        return;
    }
    const newJob: Job = {
      id: `job-${Date.now()}`,
      employerId: currentUser!.id,
      title,
      companyName,
      description,
      trials,
      startDate,
      endDate,
      contestDurationMinutes,
    };
    setJobs(prev => [...prev, newJob]);
    onBack();
  };

  const renderTrialEditor = (trial: Trial, index: number) => {
    const editorProps = {
        key: trial.id,
        trial,
        index,
        onChange: handleTrialChange,
        onRemove: handleRemoveTrial,
        onSuggest: handleSuggestTrial,
        isSuggesting: isSuggesting === index,
    };
    switch (trial.type) {
        case TrialType.MCQ:
            return <MCQEditor {...editorProps} trial={trial} />;
        case TrialType.TEXT_RESPONSE:
            return <TextResponseEditor {...editorProps} trial={trial} />;
        case TrialType.CODING_EXERCISE:
            return <CodingExerciseEditor {...editorProps} trial={trial} />;
        case TrialType.DELIVERABLE:
            return <DeliverableEditor {...editorProps} trial={trial} />;
        default:
            return null;
    }
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Create New Job Contest</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-6">
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Job Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Company Name</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"></textarea>
            </div>
        </div>

        {/* Contest Settings */}
        <div className="border-b pb-6">
             <h3 className="text-xl font-semibold text-gray-700 mb-4">Contest Settings</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                    <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                    <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Contest Duration (minutes)</label>
                    <input type="number" value={contestDurationMinutes} onChange={e => setContestDurationMinutes(parseInt(e.target.value, 10))} required min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    <p className="text-xs text-gray-500 mt-1">Set to 0 for no time limit.</p>
                </div>
             </div>
        </div>

        {/* Trials Section */}
        <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Contest Trials</h3>
            <div className="space-y-6">
                {trials.map((trial, index) => renderTrialEditor(trial, index))}
                {trials.length < 10 && (
                    <div className="flex flex-wrap gap-4 justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                        <button type="button" onClick={() => handleAddTrial(TrialType.MCQ)} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                            <PlusIcon className="w-4 h-4" /> Multiple Choice
                        </button>
                        <button type="button" onClick={() => handleAddTrial(TrialType.TEXT_RESPONSE)} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                            <DocumentTextIcon className="w-4 h-4" /> Text Response
                        </button>
                        <button type="button" onClick={() => handleAddTrial(TrialType.CODING_EXERCISE)} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                            <CodeBracketIcon className="w-4 h-4" /> Coding Exercise
                        </button>
                         <button type="button" onClick={() => handleAddTrial(TrialType.DELIVERABLE)} className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                            <ArrowUpTrayIcon className="w-4 h-4" /> Deliverable Upload
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={onBack} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">Back</button>
          <button type="submit" className="px-6 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors">Create Job</button>
        </div>
      </form>
    </div>
  );
};

// --- Trial Editors ---

interface EditorProps<T extends Trial> {
    trial: T;
    index: number;
    onChange: (index: number, trial: T) => void;
    onRemove: (id: string) => void;
    onSuggest: (index: number) => void;
    isSuggesting: boolean;
}

const TrialHeader = ({ trial, onChange, index, onSuggest, onRemove, isSuggesting, title }: { trial: Trial, onChange: (i:number, t: Trial)=>void, index: number, onSuggest: (index: number) => void, onRemove: (id: string) => void, isSuggesting: boolean, title: string }) => (
    <div className="flex items-center justify-between gap-4 mb-3">
        <label className="block text-sm font-semibold text-gray-600">{title} {index + 1}</label>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                <input type="number" value={trial.points} onChange={e => onChange(index, {...trial, points: parseInt(e.target.value, 10) || 0})} className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md" />
                <span className="text-sm text-gray-500">points</span>
            </div>
            <button type="button" onClick={() => onSuggest(index)} disabled={isSuggesting} className="flex items-center gap-2 px-3 py-1 text-sm bg-cyan-100 text-cyan-700 rounded-md hover:bg-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
               {isSuggesting ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
               {isSuggesting ? '...' : 'AI Suggest'}
            </button>
            <button type="button" onClick={() => onRemove(trial.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                <TrashIcon className="w-5 h-5"/>
            </button>
        </div>
    </div>
);


const MCQEditor = ({ trial, index, onChange, onRemove, onSuggest, isSuggesting }: EditorProps<MCQTrial>) => {
    const handleChange = <K extends keyof MCQTrial>(field: K, value: MCQTrial[K]) => {
        onChange(index, { ...trial, [field]: value });
    };
    
    const handleOptionChange = (optIndex: number, value: string) => {
        const newOptions = [...trial.options];
        newOptions[optIndex] = value;
        handleChange('options', newOptions);
    };

    return (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
            <TrialHeader trial={trial} onChange={onChange} index={index} onSuggest={onSuggest} onRemove={onRemove} isSuggesting={isSuggesting} title="Multiple Choice Question" />
            <textarea value={trial.questionText} onChange={e => handleChange('questionText', e.target.value)} required rows={2} placeholder="Question Text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"></textarea>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {trial.options.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                        <input type="radio" name={`correct-${trial.id}`} checked={trial.correctAnswerIndex === oIndex} onChange={() => handleChange('correctAnswerIndex', oIndex)} className="w-4 h-4 text-cyan-600 border-gray-300 focus:ring-cyan-500"/>
                        <input type="text" value={opt} onChange={e => handleOptionChange(oIndex, e.target.value)} required placeholder={`Option ${oIndex + 1}`} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                    </div>
                ))}
            </div>
        </div>
    );
};

const TextResponseEditor = ({ trial, index, onChange, onRemove, onSuggest, isSuggesting }: EditorProps<TextResponseTrial>) => {
    return (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
            <TrialHeader trial={trial} onChange={onChange} index={index} onSuggest={onSuggest} onRemove={onRemove} isSuggesting={isSuggesting} title="Text Response Question" />
            <textarea value={trial.prompt} onChange={e => onChange(index, { ...trial, prompt: e.target.value })} required rows={3} placeholder="Enter the prompt or question for the candidate..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"></textarea>
        </div>
    );
};

const CodingExerciseEditor = ({ trial, index, onChange, onRemove, onSuggest, isSuggesting }: EditorProps<CodingExerciseTrial>) => {
    return (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
            <TrialHeader trial={trial} onChange={onChange} index={index} onSuggest={onSuggest} onRemove={onRemove} isSuggesting={isSuggesting} title="Coding Exercise" />
            <textarea value={trial.prompt} onChange={e => onChange(index, { ...trial, prompt: e.target.value })} required rows={3} placeholder="Enter the coding prompt..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"></textarea>
        </div>
    );
};

const DeliverableEditor = ({ trial, index, onChange, onRemove, onSuggest, isSuggesting }: EditorProps<DeliverableTrial>) => {
    return (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
            <TrialHeader trial={trial} onChange={onChange} index={index} onSuggest={onSuggest} onRemove={onRemove} isSuggesting={isSuggesting} title="Deliverable Upload" />
            <textarea value={trial.prompt} onChange={e => onChange(index, { ...trial, prompt: e.target.value })} required rows={3} placeholder="Enter the instructions for the deliverable..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"></textarea>
        </div>
    );
};

// --- Results View ---

type ResultsTab = 'submissions' | 'leaderboard';

const ResultsView = ({ job, onBack }: { job: Job; onBack: () => void; }) => {
  const { submissions, users } = useData();
  const [activeTab, setActiveTab] = useState<ResultsTab>('submissions');
  const jobSubmissions = submissions.filter(s => s.jobId === job.id);

  const getCandidateEmail = (candidateId: string) => {
    return users.find(u => u.id === candidateId)?.email || 'Unknown Candidate';
  }

  const getAnswerForTrial = (submission: Submission, trialId: string): Answer | undefined => {
    return submission.answers.find(a => a.trialId === trialId);
  }
  
  const sortedSubmissions = [...jobSubmissions].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.durationSeconds - b.durationSeconds;
  });

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg">
      <div className="mb-6">
        <button onClick={onBack} className="text-sm text-cyan-600 hover:underline mb-2">&larr; Back to Job List</button>
        <h2 className="text-3xl font-bold text-gray-800">{job.title}</h2>
        <p className="text-gray-500">{job.companyName}</p>
      </div>

      <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-4">
              <button onClick={() => setActiveTab('submissions')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'submissions' ? 'border-b-2 border-cyan-500 text-cyan-600' : 'text-gray-500 hover:text-gray-700'}`}>Submissions ({jobSubmissions.length})</button>
              <button onClick={() => setActiveTab('leaderboard')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'leaderboard' ? 'border-b-2 border-cyan-500 text-cyan-600' : 'text-gray-500 hover:text-gray-700'}`}>Leaderboard</button>
          </nav>
      </div>

      {activeTab === 'leaderboard' && (
        <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2"><TrophyIcon className="w-6 h-6 text-amber-500"/> Leaderboard</h3>
            {sortedSubmissions.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Taken</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedSubmissions.map((sub, index) => (
                                <tr key={sub.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getCandidateEmail(sub.candidateId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.score} / {sub.total}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Math.floor(sub.durationSeconds / 60)}m {sub.durationSeconds % 60}s</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center text-gray-500 py-10">No submissions to rank yet.</p>
            )}
        </div>
      )}

      {activeTab === 'submissions' && (
        <div>
            {jobSubmissions.length > 0 ? (
            <div className="space-y-8">
                {jobSubmissions.map(sub => (
                    <div key={sub.id} className="border border-gray-200 rounded-lg">
                        <div className="bg-gray-50 p-4 rounded-t-lg border-b border-gray-200 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800">{getCandidateEmail(sub.candidateId)}</h3>
                            {sub.total > 0 && <p className="text-sm font-medium text-gray-600">MCQ Score: <span className="text-cyan-600 font-bold">{sub.score} / {sub.total}</span></p>}
                        </div>
                        <div className="p-4 space-y-4">
                            {job.trials.map((trial, index) => {
                               const answer = getAnswerForTrial(sub, trial.id);
                               if (!answer) return <div key={trial.id} className="text-sm text-gray-400 italic">No answer provided for trial {index + 1}.</div>;
    
                               const renderAnswer = () => {
                                  switch(trial.type) {
                                      case TrialType.MCQ:
                                          const isCorrect = trial.correctAnswerIndex === answer.value;
                                          return <p className={`text-sm pl-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>Selected: {trial.options[answer.value as number]}{!isCorrect && <span className="text-gray-500"> (Correct: {trial.options[trial.correctAnswerIndex]})</span>}</p>;
                                      case TrialType.TEXT_RESPONSE:
                                          return <p className="text-sm pl-4 whitespace-pre-wrap bg-gray-100 p-2 rounded-md border border-gray-200 mt-1">{answer.value as string}</p>;
                                      case TrialType.CODING_EXERCISE:
                                          return <pre className="text-sm pl-4 whitespace-pre-wrap bg-gray-900 text-white p-3 rounded-md border mt-1 font-mono"><code>{answer.value as string}</code></pre>;
                                      case TrialType.DELIVERABLE:
                                          const fileAnswer = answer.value as FileAnswer;
                                          return <a href={fileAnswer.dataUrl} download={fileAnswer.fileName} className="inline-flex items-center gap-2 ml-4 text-sm text-cyan-600 hover:underline"> <ArrowUpTrayIcon className="w-4 h-4 transform -rotate-45" /> {fileAnswer.fileName} </a>
                                  }
                               }

                               return (
                                   <div key={trial.id}>
                                       <p className="text-sm font-semibold text-gray-700">{index + 1}. {trial.type === TrialType.MCQ ? trial.questionText : trial.prompt}</p>
                                       {renderAnswer()}
                                   </div>
                               );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            ) : (
                <p className="text-center text-gray-500 py-10">No submissions for this job yet.</p>
            )}
        </div>
      )}
    </div>
  );
};