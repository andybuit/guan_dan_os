'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface CountdownProps {
  seconds: number;
  onComplete?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'warning' | 'danger';
}

export default function Countdown({
  seconds,
  onComplete,
  className,
  size = 'md',
  variant = 'default',
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-xl',
    lg: 'w-24 h-24 text-3xl',
  };

  const variantClasses = {
    default: 'bg-blue-100 text-blue-700 border-blue-300',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    danger: 'bg-red-100 text-red-700 border-red-300',
  };

  const currentVariant =
    timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warning' : variant;

  return (
    <div
      className={cn(
        'rounded-full border-4 flex items-center justify-center font-bold',
        sizeClasses[size],
        variantClasses[currentVariant],
        className
      )}
    >
      {timeLeft}s
    </div>
  );
}
