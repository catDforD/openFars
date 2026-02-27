import { motion } from 'framer-motion';
import { Clock, Monitor } from 'lucide-react';
import type { Job } from '@/types';
import { PulsingDot } from './PulsingDot';

interface JobCardProps {
  job: Job;
  index: number;
}

export function JobCard({ job, index }: JobCardProps) {
  return (
    <motion.div
      className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all duration-200"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{ y: -1 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">{job.time}</span>
          <div className="flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">{job.title}</span>
          </div>
        </div>
        {job.status === 'running' && (
          <PulsingDot color="#3B82F6" size={6} />
        )}
      </div>

      {/* Content */}
      <p className="text-xs text-slate-600 leading-relaxed mb-3">
        {job.content}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Clock className="w-3 h-3" />
        <span>Worked for {job.workedFor}</span>
      </div>
    </motion.div>
  );
}
