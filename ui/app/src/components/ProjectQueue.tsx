import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Project } from '@/types';
import { ProjectItem } from './ProjectItem';

interface ProjectQueueProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
}

export function ProjectQueue({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
}: ProjectQueueProps) {
  const [activeTab, setActiveTab] = useState('in_progress');

  const filteredProjects = useMemo(
    () =>
      activeTab === 'in_progress'
        ? projects.filter((project) => project.status === 'in_progress')
        : projects.filter((project) => project.status === 'completed'),
    [activeTab, projects],
  );

  return (
    <motion.aside
      className="w-[200px] bg-slate-50 border-r border-slate-200 flex flex-col"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Project Queue</h2>
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-700 text-xs font-medium"
          >
            LIVE
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-8 bg-slate-200/50 p-0.5">
            <TabsTrigger
              value="in_progress"
              className="flex-1 h-7 text-xs data-[state=active]:bg-white data-[state=active]:text-slate-900"
            >
              In Progress
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="flex-1 h-7 text-xs data-[state=active]:bg-white data-[state=active]:text-slate-900"
            >
              completed
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Project List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredProjects.map((project, index) => (
            <ProjectItem
              key={project.id}
              project={project}
              isSelected={selectedProjectId === project.id}
              onClick={() => onSelectProject(project.id)}
              index={index}
            />
          ))}
        </div>
      </ScrollArea>

      {/* New Project Button */}
      <div className="p-3 border-t border-slate-200">
        <Button
          variant="outline"
          onClick={onCreateProject}
          className="w-full h-9 text-xs font-medium border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Project
        </Button>
      </div>
    </motion.aside>
  );
}
