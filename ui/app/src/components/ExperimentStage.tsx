import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ExperimentStep } from '@/types';
import { StageIndicator } from './StageIndicator';
import { StepItem } from './StepItem';

interface ExperimentStageProps {
  steps: ExperimentStep[];
}

export function ExperimentStage({ steps }: ExperimentStageProps) {
  return (
    <motion.main
      className="flex-1 bg-background flex flex-col min-w-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <ScrollArea className="flex-1">
        <div className="p-5">
          {/* Stage Indicator */}
          <StageIndicator currentStage="experiment" />

          {/* Steps List */}
          <motion.div
            className="space-y-0"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }}
          >
            {steps.map((step, index) => (
              <StepItem key={step.id} step={step} index={index} />
            ))}
          </motion.div>
        </div>
      </ScrollArea>
    </motion.main>
  );
}
