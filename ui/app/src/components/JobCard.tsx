import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Clock, Copy, Monitor } from 'lucide-react';
import type { Job } from '@/types';
import { Button } from '@/components/ui/button';
import { PulsingDot } from './PulsingDot';

interface JobCardProps {
  job: Job;
  index: number;
}

export function JobCard({ job, index }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedRaw = useMemo(() => {
    try {
      const parsed = JSON.parse(job.raw);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return job.raw;
    }
  }, [job.raw]);

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(formattedRaw);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.div
      className="bg-card text-card-foreground rounded-lg border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{ y: -1 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">{job.time}</span>
          <div className="flex items-center gap-1.5">
            <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{job.title}</span>
          </div>
        </div>
        {job.status === 'running' && (
          <PulsingDot color="#3B82F6" size={6} />
        )}
      </div>

      {/* Content */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        {job.content}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          <span>Worked for {job.workedFor}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded((current) => !current)}
        >
          详情
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="px-1.5 py-0.5 rounded bg-slate-100">status: {job.status}</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100">level: {job.level}</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100">source: {job.source}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-600">Raw Log</span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={() => {
                void handleCopyRaw();
              }}
            >
              <Copy className="w-3 h-3 mr-1" />
              {copied ? '已复制' : '复制'}
            </Button>
          </div>

          <pre className="max-h-48 overflow-auto rounded bg-slate-950 text-slate-100 text-[11px] leading-relaxed p-2 whitespace-pre-wrap break-all">
            {formattedRaw || '(empty)'}
          </pre>
        </div>
      )}
    </motion.div>
  );
}
