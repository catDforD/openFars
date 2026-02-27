import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Job } from '@/types';
import { JobCard } from './JobCard';

interface JobMonitorProps {
  jobs: Job[];
}

export function JobMonitor({ jobs }: JobMonitorProps) {
  return (
    <motion.aside
      className="w-[320px] bg-slate-50 border-l border-slate-200 flex flex-col"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-sm" />
          </div>
          <h2 className="text-sm font-semibold text-slate-700">Job Monitor</h2>
        </div>
      </div>

      {/* Job List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {jobs.map((job, index) => (
            <JobCard key={job.id} job={job} index={index} />
          ))}
        </div>
      </ScrollArea>
    </motion.aside>
  );
}
