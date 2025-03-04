// src/app/page.tsx
'use client';

import { useState } from 'react';
import ResearchForm from '@/components/ResearchForm';
import ResearchResult from '@/components/ResearchResult';

interface FormData {
  segmentInfo: string;
}

export default function Home() {
  const [generatedResearch, setGeneratedResearch] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const generateResearch = async (formData: FormData) => {
    setError(null);
    setIsGenerating(true);
    setGeneratedResearch('');
    setProgressStatus('Creating LinkedIn Sales Navigator strategy...');

    try {
      const response = await fetch('/api/generate-segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segmentInfo: formData.segmentInfo }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate strategy: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.result) {
        throw new Error('No result returned from strategy generation');
      }
      
      setGeneratedResearch(data.result);
      
    } catch (error) {
      console.error('Error generating research:', error);
      setError('An error occurred while generating the targeting strategy. Please try again.');
      setGeneratedResearch(null);
    } finally {
      setIsGenerating(false);
      setProgressStatus('');
    }
  };

  const resetGenerator = () => {
    setGeneratedResearch(null);
    setError(null);
  };

  return (
    <div className="py-10 px-4 container mx-auto">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-[#f7f8f8]">LinkedIn Sales Navigator Targeting</h1>
          <p className="text-[#8a8f98]">
            Generate optimized targeting strategies for your market research segments
          </p>
        </div>
        
        {error && (
          <div className="bg-red-900/30 border border-red-700/30 text-red-300 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}
        
        <div className="card">
          {generatedResearch ? (
            <ResearchResult 
              content={generatedResearch}
              onReset={resetGenerator}
            />
          ) : (
            <ResearchForm onSubmit={generateResearch} />
          )}
        </div>
        
        {isGenerating && (
          <div className="text-center mt-4">
            <p className="text-[#8a8f98]">
              {progressStatus || 'Generating targeting strategy...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}