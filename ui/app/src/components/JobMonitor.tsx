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
      className="w-[320px] bg-muted/30 border-l border-border flex flex-col min-h-0"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
            <div className="w-2 h-2 bg-primary-foreground rounded-sm" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Job Monitor</h2>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">点击每条日志右侧“详情”可查看 raw 输出与元信息。</p>
      </div>

      {/* Job List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-3">
          {jobs.map((job, index) => (
            <JobCard key={job.id} job={job} index={index} />
          ))}
        </div>
      </ScrollArea>
    </motion.aside>
  );
}
