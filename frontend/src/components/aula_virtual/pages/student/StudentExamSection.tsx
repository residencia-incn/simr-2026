import React, { useState } from 'react';
import StudentExamDashboard from './StudentExamDashboard';
import StudentExamRunner from './StudentExamRunner';
import StudentExamResult from './StudentExamResult';
import { StudentExamAttempt } from '../../types';

type ExamView = 'DASHBOARD' | 'RUNNER' | 'RESULT';

const StudentExamSection: React.FC = () => {
    const [view, setView] = useState<ExamView>('DASHBOARD');
    const [selectedExamId, setSelectedExamId] = useState<string | number | null>(null);
    const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);

    const handleStartExam = (examId: string | number) => {
        setSelectedExamId(examId);
        setView('RUNNER');
    };

    const handleFinishExam = (attempt: StudentExamAttempt) => {
        setCurrentAttemptId(attempt.id);
        setView('RESULT');
    };

    const handleViewResult = (examId: string | number) => {
        // Logic to find the last attempt ID for this exam would need to be passed or fetched inside result
        // For now, let's assume we find it inside the component or pass it if we have it here. 
        // Simplification: We need the attempt ID to show results. 
        // In a real app we might fetch "last attempt for exam X".
        // Let's pass the examId and let Result component find the latest attempt for currentUser.
        // Wait, Result component expects attemptId. 
        // Let's modify Result to optionally take examId and find latest attempt itself? 
        // Or find it here.
        // Let's pass the examId to logic here to find attempt. but we need context access here.
        // Easier: modify Result component logic to find latest if specific attemptId not provided?
        // Let's stick to passing attemptId. But we need to find it first.
        // For now, let's fake passing a "search" signal or handle it inside Result if we pass examId too.

        // Actually StudentExamResult takes attemptId. Let's redirect to dashboard if we can't find it?
        // No, let's allow finding by ExamID inside Result if we update its props.
        // But for strictly following the interface, I'll pass a dummy ID or update the interface.
        // Let's update `StudentExamResult` locally or just pass the examId and let it handle finding the attempt.
        // I will update StudentExamResult to accept examId as well.

        // For this step, I'll assume we find it or I'll pass the ID if I can get it from context.
        // Since I can't use hook here easily without refactoring imports or making this complex, 
        // I'll update the Result component state to find by ExamId if AttemptId is missing.

        setSelectedExamId(examId);
        // We don't have attempt ID here easily without context. 
        // I'll update the flow to pass just examId to result view and let it find the latest attempt.
        setView('RESULT');
    };

    return (
        <div className="h-full flex flex-col">
            {view === 'DASHBOARD' && (
                <StudentExamDashboard
                    onStartExam={handleStartExam}
                    onViewResult={handleViewResult}
                />
            )}

            {view === 'RUNNER' && selectedExamId && (
                <StudentExamRunner
                    examId={selectedExamId}
                    onFinish={handleFinishExam}
                    onBack={() => setView('DASHBOARD')}
                />
            )}

            {view === 'RESULT' && (
                <StudentExamResult
                    attemptId={currentAttemptId || ''} // Needs fix, will update Result component to likely take examId too or find it
                    examIdProp={selectedExamId || ''} // Passing examId as fallback
                    onBack={() => setView('DASHBOARD')}
                    onRetake={() => setView('RUNNER')}
                />
            )}
        </div>
    );
};

export default StudentExamSection;
