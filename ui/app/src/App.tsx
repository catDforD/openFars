import { Header } from '@/components/Header';
import { ProjectQueue } from '@/components/ProjectQueue';
import { ExperimentStage } from '@/components/ExperimentStage';
import { JobMonitor } from '@/components/JobMonitor';
import { StatsBar } from '@/components/StatsBar';
import { useRunStore } from '@/store/runStore';

function App() {
  const {
    projects,
    selectedProjectId,
    run,
    steps,
    jobs,
    stats,
    paperTitle,
    connected,
    loading,
    isStarting,
    error,
    selectProject,
    createAndSelectProject,
    startSimpleRun,
    sendControl,
  } = useRunStore();

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <Header
        paperTitle={paperTitle}
        connected={connected}
        runStatus={run?.status ?? null}
        busy={isStarting}
        onStartTest={() => {
          void startSimpleRun();
        }}
        onPause={() => {
          void sendControl('pause');
        }}
        onResume={() => {
          void sendControl('resume');
        }}
        onCancel={() => {
          void sendControl('cancel');
        }}
      />

      {error && (
        <div className="px-4 py-2 text-xs bg-red-50 border-b border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden" style={{ marginBottom: '80px' }}>
        {/* Left Sidebar - Project Queue */}
        <ProjectQueue
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={(projectId) => {
            void selectProject(projectId);
          }}
          onCreateProject={() => {
            void createAndSelectProject();
          }}
        />

        {/* Center - Experiment Stage */}
        <ExperimentStage steps={steps} />

        {/* Right Sidebar - Job Monitor */}
        <JobMonitor jobs={jobs} />
      </div>

      {/* Bottom Stats Bar */}
      <StatsBar stats={stats} />

      {loading && (
        <div className="fixed inset-0 bg-background/70 backdrop-blur-[1px] z-50 flex items-center justify-center text-sm text-muted-foreground">
          Initializing OpenFARS session...
        </div>
      )}
    </div>
  );
}

export default App;
