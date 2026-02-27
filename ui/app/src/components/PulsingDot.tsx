import { motion } from 'framer-motion';

interface PulsingDotProps {
  color?: string;
  size?: number;
}

export function PulsingDot({ color = '#3B82F6', size = 8 }: PulsingDotProps) {
  return (
    <motion.div
      className="rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
      animate={{
        scale: [1, 1.3, 1],
        opacity: [1, 0.6, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
