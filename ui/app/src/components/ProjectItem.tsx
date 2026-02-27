import { motion } from 'framer-motion';
import type { Project } from '@/types';

interface ProjectItemProps {
  project: Project;
  isSelected: boolean;
  onClick: () => void;
  index: number;
}

export function ProjectItem({ project, isSelected, onClick, index }: ProjectItemProps) {
  return (
    <motion.div
      className={`px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-all duration-200 ${
        isSelected
          ? 'bg-primary/10 border border-primary/20 shadow-sm text-primary font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      }`}
      onClick={onClick}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      whileHover={{ x: isSelected ? 0 : 2 }}
    >
      {project.name}
    </motion.div>
  );
}
