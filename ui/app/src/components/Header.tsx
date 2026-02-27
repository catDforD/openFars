import { motion } from 'framer-motion';
import { Pause, Play, Square } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { RunStatus } from '@/types';
import { ThemeToggle } from '@/components/theme-toggle';

interface HeaderProps {
  paperTitle: string;
  connected: boolean;
  runStatus: RunStatus | null;
  busy: boolean;
  onStartTest: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

export function Header({
  paperTitle,
  connected,
  runStatus,
  busy,
  onStartTest,
  onPause,
  onResume,
  onCancel,
}: HeaderProps) {
  const canPause = runStatus === 'running';
  const canResume = runStatus === 'paused' || runStatus === 'pending';
  const canCancel = runStatus === 'running' || runStatus === 'paused' || runStatus === 'pending';

  return (
    <motion.header
      className="h-14 bg-background border-b border-border flex items-center justify-between px-4 sticky top-0 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <motion.span
          className="text-lg font-bold text-foreground tracking-tight"
          whileHover={{ opacity: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          FARS
        </motion.span>
        <Badge
          variant="secondary"
          className={
            connected
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 text-xs font-medium px-2 py-0.5'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 text-xs font-medium px-2 py-0.5'
          }
        >
          {connected ? 'LIVE' : 'SYNCING'}
        </Badge>
      </div>

      {/* Center: Title */}
      <motion.div
        className="flex-1 mx-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <h1 className="text-sm font-semibold text-foreground truncate max-w-2xl mx-auto" title={paperTitle}>
          {paperTitle}
        </h1>
      </motion.div>

      {/* Right: Controls + Theme + Avatar */}
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {runStatus ?? 'idle'}
        </Badge>
        <Button size="sm" className="h-8 px-2.5 text-xs" disabled={busy} onClick={onStartTest}>
          <Play className="w-3.5 h-3.5 mr-1" />
          开始测试
        </Button>
        <Button size="sm" variant="outline" className="h-8 px-2 text-xs" disabled={!canPause} onClick={onPause}>
          <Pause className="w-3.5 h-3.5 mr-1" />
          暂停
        </Button>
        <Button size="sm" variant="outline" className="h-8 px-2 text-xs" disabled={!canResume} onClick={onResume}>
          <Play className="w-3.5 h-3.5 mr-1" />
          继续
        </Button>
        <Button size="sm" variant="destructive" className="h-8 px-2 text-xs" disabled={!canCancel} onClick={onCancel}>
          <Square className="w-3.5 h-3.5 mr-1" />
          停止
        </Button>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <ThemeToggle />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
        >
          <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-border">
            <AvatarImage src="/avatar.png" alt="User" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
              RS
            </AvatarFallback>
          </Avatar>
        </motion.div>
      </motion.div>
    </motion.header>
  );
}
