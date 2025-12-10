import React from 'react';
import { BrainCircuit, PenTool, Sparkles, Wand2, Search, CheckCircle2, AlertCircle } from 'lucide-react';

export enum PipelineStage {
  IDLE = 'IDLE',
  CONTEXT = 'CONTEXT',
  RESEARCH = 'RESEARCH',
  OUTLINE = 'OUTLINE',
  AUTHOR_ASSIGNMENT = 'AUTHOR_ASSIGNMENT',
  DRAFTING = 'DRAFTING',
  HUMANIZING = 'HUMANIZING',
  ENHANCING = 'ENHANCING',
  SEO_OPTIMIZATION = 'SEO_OPTIMIZATION',
  QA = 'QA',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

interface Props {
  currentStage: PipelineStage;
  error?: string;
}

const stages = [
  { id: PipelineStage.CONTEXT, label: "Context", icon: Search },
  { id: PipelineStage.AUTHOR_ASSIGNMENT, label: "Persona", icon: BrainCircuit },
  { id: PipelineStage.DRAFTING, label: "Drafting", icon: PenTool },
  { id: PipelineStage.HUMANIZING, label: "Humanize", icon: Wand2 },
  { id: PipelineStage.ENHANCING, label: "Enhance", icon: Sparkles }, 
  { id: PipelineStage.QA, label: "Quality", icon: CheckCircle2 },
];

const stageOrder = [
  PipelineStage.IDLE,
  PipelineStage.CONTEXT,
  PipelineStage.AUTHOR_ASSIGNMENT,
  PipelineStage.DRAFTING,
  PipelineStage.HUMANIZING,
  PipelineStage.ENHANCING,
  PipelineStage.QA,
  PipelineStage.COMPLETE,
];

export function PipelineVisualizer({ currentStage, error }: Props) {
  const currentIndex = stageOrder.indexOf(currentStage);

  const progressWidth = currentStage === PipelineStage.COMPLETE ? 100 :
    currentStage === PipelineStage.IDLE ? 0 :
    currentStage === PipelineStage.ERROR ? currentIndex / (stages.length - 1) * 100 :
    (Math.max(0, currentIndex - 1) / (stages.length - 1)) * 100;

  return (
    <div className="w-full py-8 overflow-x-auto">
      <div className="min-w-[700px] flex items-center justify-between relative px-6">
        
        {/* Connection Lines Background */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-void-800 -z-10" />
        
        {/* Animated Progress Line */}
        <div 
          className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-forge-accent -z-10 transition-all duration-700 ease-out shadow-glow-sm"
          style={{ width: `calc(${progressWidth}% - 48px)` }}
        />

        {stages.map((stage, idx) => {
          const thisIndex = stageOrder.indexOf(stage.id);
          const isCompleted = currentIndex > thisIndex || currentStage === PipelineStage.COMPLETE;
          const isActive = currentIndex === thisIndex && currentStage !== PipelineStage.COMPLETE && currentStage !== PipelineStage.ERROR;
          const isPending = currentIndex < thisIndex && currentStage !== PipelineStage.COMPLETE;
          const isError = currentStage === PipelineStage.ERROR && currentIndex === thisIndex;

          const Icon = isError ? AlertCircle : stage.icon;
          
          return (
            <div key={stage.id} className="relative flex flex-col items-center group">
              
              {/* Node Circle */}
              <div 
                className={[
                  'w-14 h-14 rounded-2xl rotate-45 flex items-center justify-center transition-all duration-500 relative border',
                  isActive ? 'bg-void-900 border-forge-accent shadow-glow-accent scale-110 z-10' : '',
                  isCompleted ? 'bg-indigo-950/50 border-indigo-500/50 text-indigo-400 shadow-glow-sm' : '',
                  isPending ? 'bg-void-950 border-void-800 text-slate-700' : '',
                  isError ? 'bg-red-950/50 border-red-500/50 text-red-400' : '',
                ].join(' ')}
              >
                {/* Icon (rotated back to 0) */}
                <div className="-rotate-45">
                  <Icon className={[
                    'w-6 h-6',
                    isActive ? 'text-forge-accent animate-pulse' : '',
                    isCompleted ? 'text-indigo-400' : '',
                    isError ? 'text-red-400' : '',
                  ].join(' ')} />
                </div>

                {/* Active Ripple */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl border border-forge-accent opacity-0 animate-ping" />
                )}
              </div>

              {/* Label */}
              <div className={[
                'absolute top-20 text-xs font-display font-medium uppercase tracking-widest transition-all duration-300',
                isActive ? 'text-forge-accent translate-y-0 opacity-100' : '',
                isCompleted ? 'text-indigo-300 translate-y-0 opacity-80' : '',
                isPending ? 'text-slate-700 translate-y-2 opacity-0 group-hover:opacity-50 group-hover:translate-y-0' : '',
                isError ? 'text-red-400 translate-y-0 opacity-100' : '',
              ].join(' ')}>
                {stage.label}
              </div>
            </div>
          );
        })}
      </div>
      
      {error && (
        <div className="mt-8 mx-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

export default PipelineVisualizer;
