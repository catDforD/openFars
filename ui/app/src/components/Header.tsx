import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  paperTitle: string;
  connected: boolean;
}

export function Header({ paperTitle, connected }: HeaderProps) {
  return (
    <motion.header
      className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <motion.span
          className="text-lg font-bold text-slate-900 tracking-tight"
          whileHover={{ opacity: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          FARS
        </motion.span>
        <Badge
          variant="secondary"
          className={
            connected
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs font-medium px-2 py-0.5'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs font-medium px-2 py-0.5'
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
        <h1 className="text-sm font-semibold text-slate-800 truncate max-w-2xl mx-auto" title={paperTitle}>
          {paperTitle}
        </h1>
      </motion.div>

      {/* Right: Avatar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        whileHover={{ scale: 1.05 }}
      >
        <Avatar className="w-8 h-8 cursor-pointer ring-2 ring-slate-100">
          <AvatarImage src="/avatar.png" alt="User" />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs">
            RS
          </AvatarFallback>
        </Avatar>
      </motion.div>
    </motion.header>
  );
}
