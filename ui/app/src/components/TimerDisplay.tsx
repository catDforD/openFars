import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TimerDisplayProps {
  initialTime: string;
}

export function TimerDisplay({ initialTime }: TimerDisplayProps) {
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    // Parse initial time (format: HH:MM:SS or D:HH:MM:SS)
    const parts = initialTime.split(':').map(Number);
    let totalSeconds = 0;
    
    if (parts.length === 3) {
      totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 4) {
      totalSeconds = parts[0] * 86400 + parts[1] * 3600 + parts[2] * 60 + parts[3];
    }

    const interval = setInterval(() => {
      totalSeconds++;
      
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      if (days > 0) {
        setTime(`${days}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [initialTime]);

  return (
    <motion.div
      className="text-lg font-semibold text-slate-900 font-mono"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      T+ {time}
    </motion.div>
  );
}
