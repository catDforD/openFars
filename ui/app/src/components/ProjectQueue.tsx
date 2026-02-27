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
      className="w-[200px] bg-muted/30 border-r border-border flex flex-col"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Project Queue</h2>
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-xs font-medium"
          >
            LIVE
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-8 bg-muted p-0.5">
            <TabsTrigger
              value="in_progress"
              className="flex-1 h-7 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              In Progress
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="flex-1 h-7 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              Completed
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
          {filteredProjects.length === 0 && (
            <div className="px-3 py-4 text-xs text-slate-500 leading-relaxed">
              当前没有可显示项目。创建项目后点击顶部“开始测试”创建并运行新任务。
            </div>
          )}
        </div>
      </ScrollArea>

      {/* New Project Button */}
      <div className="p-3 border-t border-border">
        <Button
          variant="outline"
          onClick={onCreateProject}
          className="w-full h-9 text-xs font-medium border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Project
        </Button>
      </div>
    </motion.aside>
  );
}
