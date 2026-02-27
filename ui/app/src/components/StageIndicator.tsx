import { motion } from 'framer-motion';
import { Lightbulb, ClipboardList, FlaskConical, FileText } from 'lucide-react';
import type { Stage } from '@/types';

interface StageIndicatorProps {
  currentStage: Stage;
}

const stages: { id: Stage; label: string; icon: React.ElementType }[] = [
  { id: 'ideation', label: 'Ideation', icon: Lightbulb },
  { id: 'planning', label: 'Planning', icon: ClipboardList },
  { id: 'experiment', label: 'Experiment', icon: FlaskConical },
  { id: 'writing', label: 'Writing', icon: FileText },
];

export function StageIndicator({ currentStage }: StageIndicatorProps) {
  const currentIndex = stages.findIndex(s => s.id === currentStage);

  return (
    <div className="flex items-center justify-between mb-6">
      {stages.map((stage, index) => {
        const Icon = stage.icon;
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;

        return (
          <div key={stage.id} className="flex items-center flex-1">
            <motion.div
              className={`flex flex-col items-center gap-2 ${
                isActive ? 'text-indigo-600' : isCompleted ? 'text-emerald-500' : 'text-slate-400'
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-50'
                    : isCompleted
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-300 bg-slate-50'
                }`}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <span className={`text-sm font-medium ${
                isActive ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-slate-500'
              }`}>
                {stage.label}
              </span>
            </motion.div>
            
            {index < stages.length - 1 && (
              <div className="flex-1 mx-4 relative">
                <div className="h-0.5 bg-slate-200 rounded-full" />
                <motion.div
                  className="absolute top-0 left-0 h-0.5 bg-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: isCompleted ? '100%' : isActive ? '50%' : '0%' }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
