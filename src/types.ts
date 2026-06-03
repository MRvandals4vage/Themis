export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description?: string;
}

export interface LatencyPoint {
  label: string;
  value: number; // percentage heights for visual bars representation
  isCore?: boolean;
}

export interface ProposedIssue {
  title: string;
  description: string;
  proposedFix: string;
  labels: string[];
}

export interface Incident {
  id: string;
  caseCode: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  time: string; // e.g. '14:22 UTC'
  title: string;
  resource: string;
  description: string;
  aiConfidence: number;
  rootCauseAnalysis: string;
  sourceFile: string;
  sourceLine: number;
  codeSnippet: string;
  codeSnippetTail?: string;
  highlightedLine: string;
  timeline: TimelineEvent[];
  latencyProfile: LatencyPoint[];
  proposedIssue: ProposedIssue;
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'classifier' | 'agent' | 'resolution';
  label: string;
  subText: string;
  icon: string; // identifier of lucide react icons
  status?: 'ONLINE' | 'ACTIVE' | 'OFFLINE' | 'STABLE';
  latency?: string;
  x: number; // grid position x percentage
  y: number; // grid position y percentage
}

export interface RecentFailure {
  id: string;
  service: string;
  environment: string;
  errorType: string;
  duration: string;
  status: 'CRITICAL' | 'RESOLVED' | 'ONGOING' | 'WARNING';
}

export interface ExecutiveMetrics {
  activeIncidentsCount: number;
  activeIncidentsDelta: string;
  failedPipelinesCount: number;
  failedPipelinesStatus: string;
  aiResolutionRate: number;
  aiResolutionDelta: string;
  avgRecoveryTime: string;
  avgRecoveryDelta: string;
}
