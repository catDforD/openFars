import { motion } from 'framer-motion';
import { Rocket, Lightbulb, FileText, Database, DollarSign } from 'lucide-react';
import type { Stats } from '@/types';
import { TimerDisplay } from './TimerDisplay';

interface StatsBarProps {
  stats: Stats;
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <motion.footer
      className="h-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border flex items-center justify-between px-6 fixed bottom-0 left-0 right-0 z-40"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
    >
      {/* Left Stats */}
      <div className="flex items-center gap-6">
        {/* Hypothesis */}
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <motion.div
              className="text-2xl font-bold text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {stats.hypothesis}
            </motion.div>
            <div className="text-xs text-muted-foreground">Hypothesis</div>
          </div>
        </motion.div>

        {/* Papers */}
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <motion.div
              className="text-2xl font-bold text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              {stats.papers}
            </motion.div>
            <div className="text-xs text-muted-foreground">Paper</div>
          </div>
        </motion.div>
      </div>

      {/* Center Progress */}
      <div className="flex flex-col items-center gap-2">
        <TimerDisplay initialTime={stats.elapsedTime} />
        
        {/* Progress Bar */}
        <div className="flex items-center gap-3 w-80">
          <div className="flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Launched</span>
          </div>
          
          <div className="flex-1 relative h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '75%' }}
              transition={{ delay: 0.5, duration: 1, ease: [0.4, 0, 0.2, 1] }}
            />
            {/* Progress Dots */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full" />
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full"
              initial={{ left: 0 }}
              animate={{ left: '75%' }}
              transition={{ delay: 0.5, duration: 1, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
          
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Hypothesis +350</span>
          </div>
        </div>
      </div>

      {/* Right Stats */}
      <div className="flex items-center gap-6">
        {/* Tokens */}
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <Database className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <motion.div
              className="text-2xl font-bold text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              {stats.tokens}
            </motion.div>
            <div className="text-xs text-muted-foreground">Tokens</div>
          </div>
        </motion.div>

        {/* Cost */}
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <motion.div
              className="text-2xl font-bold text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              {stats.cost}
            </motion.div>
            <div className="text-xs text-muted-foreground">Cost($)</div>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
}
