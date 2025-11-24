import React from 'react';
import Header from './components/Header';
import LessonPlanForm from './components/LessonPlanForm';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <Header />
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <LessonPlanForm />
      </main>
    </div>
  );
};

export default App;