import React from 'react';
import { SparklesIcon, DocumentTextIcon, TrophyIcon, CodeBracketIcon } from './icons';

const Feature = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
    <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-md transition-transform transform hover:-translate-y-2">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-cyan-100 text-cyan-600 mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600">{children}</p>
    </div>
);

export default function LandingPage({ onGetStarted }: { onGetStarted: () => void; }) {
    return (
        <div className="bg-gray-50 text-gray-800">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-3xl font-extrabold">
                        eval<span className="text-cyan-600 font-bold">.</span>me
                    </h1>
                    <button
                        onClick={onGetStarted}
                        className="px-6 py-2 font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors"
                    >
                        Get Started
                    </button>
                </nav>
            </header>

            {/* Hero Section */}
            <main>
                <section className="text-center bg-white py-20 sm:py-24 lg:py-32">
                    <div className="container mx-auto px-6">
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
                            Go Beyond Resumes.
                            <br />
                            <span className="text-cyan-600">Discover True Talent.</span>
                        </h2>
                        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
                            Create custom skill assessments, evaluate candidates with real-world challenges, and hire the best fit, faster.
                        </p>
                        <button
                            onClick={onGetStarted}
                            className="mt-10 px-10 py-4 text-lg font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-transform transform hover:scale-105"
                        >
                            Find Your Next Hire
                        </button>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 sm:py-24">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900">A Hiring Platform Built for Accuracy</h2>
                            <p className="mt-4 text-lg text-gray-600">Stop guessing. Start making data-driven hiring decisions.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <Feature
                                icon={<CodeBracketIcon className="w-8 h-8" />}
                                title="Custom Assessments"
                            >
                                Build tailored contests with multiple trial types: MCQs, text responses, coding exercises, file deliverables, and more.
                            </Feature>
                            <Feature
                                icon={<SparklesIcon className="w-8 h-8" />}
                                title="AI-Powered Suggestions"
                            >
                                Save time with AI-generated questions and prompts that are directly relevant to your specific job role.
                            </Feature>
                            <Feature
                                icon={<TrophyIcon className="w-8 h-8" />}
                                title="Data-Driven Decisions"
                            >
                                Instantly see top performers with automated scoring and a dynamic leaderboard for every job contest.
                            </Feature>
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="bg-white">
                    <div className="container mx-auto px-6 py-20 text-center">
                        <h2 className="text-3xl font-bold text-gray-900">Ready to transform your hiring process?</h2>
                        <p className="mt-4 max-w-xl mx-auto text-lg text-gray-600">
                            Join leading companies who use eval.me to identify and hire the most qualified candidates.
                        </p>
                        <button
                            onClick={onGetStarted}
                            className="mt-8 px-8 py-3 text-lg font-bold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-transform transform hover:scale-105"
                        >
                            Start Hiring Smarter
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white">
                <div className="container mx-auto px-6 py-6 text-center">
                    <p>&copy; {new Date().getFullYear()} eval.me. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
