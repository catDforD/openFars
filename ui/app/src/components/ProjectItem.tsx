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
          ? 'bg-white border border-indigo-200 shadow-sm text-indigo-700 font-medium'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
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
