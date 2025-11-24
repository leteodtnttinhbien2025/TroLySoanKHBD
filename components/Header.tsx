import React from 'react';
import { AIIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm w-full">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center gap-4">
        <AIIcon />
        <h1 className="text-2xl font-bold text-indigo-800 tracking-tight">
          Trợ lý AI Soạn Kế hoạch bài dạy 5512
        </h1>
      </div>
    </header>
  );
};

export default Header;
