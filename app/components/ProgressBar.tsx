// app/components/ProgressBar.tsx
import React from 'react';

interface ProgressBarProps {
  completedLessons: number;
  totalLessons: number;
}

export function ProgressBar({ completedLessons, totalLessons }: ProgressBarProps) {
  const progress = (completedLessons / totalLessons) * 100;

  return (
    <div className="w-full flex gap-4 items-center">
      <div className="w-full bg-layout-border rounded-full h-2.5">
        <div className="bg-primary-100 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="text-sm font-medium">{progress.toFixed(0)}%</div>
    </div>
  );
}