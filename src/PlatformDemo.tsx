import React from 'react';
import PlatformSelector from './components/PlatformSelector';

const PlatformDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
          Platform Selector Demo
        </h1>
        <p className="text-gray-600 text-center mb-12">
          Click on any platform icon to see its posting capabilities
        </p>
        <PlatformSelector />
      </div>
    </div>
  );
};

export default PlatformDemo;



