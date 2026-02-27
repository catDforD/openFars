import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Loader2, Circle, X } from 'lucide-react';
import type { ExperimentStep, StepStatus } from '@/types';
import { PulsingDot } from './PulsingDot';

interface StepItemProps {
  step: ExperimentStep;
  index: number;
}

const statusConfig: Record<StepStatus, { icon: React.ElementType; color: string; bgColor: string }> = {
  completed: { icon: Check, color: 'text-emerald-600 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-500/15' },
  running: { icon: Loader2, color: 'text-blue-600 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-500/15' },
  pending: { icon: Circle, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  error: { icon: X, color: 'text-red-600 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-500/15' },
};

export function StepItem({ step, index }: StepItemProps) {
  const [isExpanded, setIsExpanded] = useState(step.status === 'running');
  const hasSubSteps = step.subSteps && step.subSteps.length > 0;
  const config = statusConfig[step.status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      className="border-b border-border/60 last:border-b-0"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <motion.div
        className={`flex items-start gap-3 py-3 px-2 rounded-lg cursor-pointer transition-colors ${
          step.status === 'running' ? 'bg-blue-50/60 dark:bg-blue-500/10' : 'hover:bg-accent/60'
        }`}
        onClick={() => hasSubSteps && setIsExpanded(!isExpanded)}
        whileHover={{ x: hasSubSteps ? 2 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Status Icon */}
        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${config.bgColor}`}>
          {step.status === 'running' ? (
            <PulsingDot color="#3B82F6" size={6} />
          ) : (
            <StatusIcon className={`w-4 h-4 ${config.color}`} />
          )}
        </div>

        {/* Step Number */}
        <span className="flex-shrink-0 w-6 text-sm font-medium text-muted-foreground">
          {step.number}.
        </span>

        {/* Step Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${
              step.status === 'completed' ? 'text-muted-foreground line-through' :
              step.status === 'running' ? 'text-foreground font-medium' :
              'text-muted-foreground'
            }`}>
              {step.title}
            </span>
            {step.status === 'completed' && (
              <span className="text-xs text-emerald-600 dark:text-emerald-300 font-medium">Completed</span>
            )}
            {step.status === 'running' && (
              <span className="text-xs text-blue-600 dark:text-blue-300 font-medium">Running</span>
            )}
          </div>
        </div>

        {/* Expand Icon */}
        {hasSubSteps && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        )}
      </motion.div>

      {/* Sub Steps */}
      <AnimatePresence>
        {isExpanded && hasSubSteps && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pl-12 pr-4 pb-3 space-y-2">
              {step.subSteps?.map((subStep, subIndex) => {
                const subConfig = statusConfig[subStep.status];
                const SubIcon = subConfig.icon;
                
                return (
                  <motion.div
                    key={subStep.id}
                    className={`flex items-start gap-2 py-1.5 px-2 rounded-md ${
                      subStep.status === 'running' ? 'bg-blue-50/60 dark:bg-blue-500/10' : 'hover:bg-accent/60'
                    }`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: subIndex * 0.05, duration: 0.2 }}
                  >
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${subConfig.bgColor}`}>
                      {subStep.status === 'running' ? (
                        <PulsingDot color="#3B82F6" size={5} />
                      ) : (
                        <SubIcon className={`w-3 h-3 ${subConfig.color}`} />
                      )}
                    </div>
                    <span className={`text-xs ${
                      subStep.status === 'completed' ? 'text-muted-foreground line-through' :
                      subStep.status === 'running' ? 'text-foreground' :
                      'text-muted-foreground'
                    }`}>
                      {subStep.content}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
