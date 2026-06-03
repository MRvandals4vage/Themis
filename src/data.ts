import { Incident, WorkflowNode, RecentFailure, ExecutiveMetrics } from './types';

export const initialIncidents: Incident[] = [
  {
    id: 'inc-1',
    caseCode: 'CASE #INC-942-03',
    status: 'INVESTIGATING',
    level: 'CRITICAL',
    time: '14:22 UTC',
    title: 'Database Connection Timeout in us-east-1',
    resource: 'RDS-PROD-01',
    description: 'Forensic analysis of a cascading failure within the primary RDS instance triggered by an unoptimized query sequence in the payment-gateway service.',
    aiConfidence: 98,
    rootCauseAnalysis: "DETECTED: Excessive connection pooling exhaustion caused by 'ORDER BY' operations on non-indexed 'transaction_metadata' column in payment-gateway v2.4.1.",
    sourceFile: 'query_optimizer.py',
    sourceLine: 144,
    codeSnippet: `// Identified problematic query sequence
SELECT * FROM transactions 
WHERE status = 'PENDING' `,
    highlightedLine: "ORDER BY metadata->>'provider_id'",
    codeSnippetTail: `LIMIT 100 FOR UPDATE SKIP LOCKED;`,
    timeline: [
      { id: 't1', time: '14:22:01', title: 'Alert: ConnectionTimeout', description: 'DB pools exhausted' },
      { id: 't2', time: '14:22:15', title: 'AI Agent scanning RDS logs', description: 'Log anomaly detected' },
      { id: 't3', time: '14:22:48', title: 'Identified Root Cause', description: 'Query mismatch found at query_optimizer.py:144' }
    ],
    latencyProfile: [
      { label: 'T-30M', value: 20 },
      { label: '', value: 35 },
      { label: '', value: 15 },
      { label: 'NOW', value: 100, isCore: true },
      { label: '', value: 90 },
      { label: '', value: 75 },
      { label: '+15M EST', value: 25 }
    ],
    proposedIssue: {
      title: 'Bug: Connection Exhaustion in payment-gateway service',
      description: 'The system is failing to return connections to the pool due to heavy sorting on non-indexed JSONB columns.',
      proposedFix: "Add a GIN index to metadata->'provider_id' or implement client-side sorting.",
      labels: ['p0', 'incident-response']
    }
  },
  {
    id: 'inc-2',
    caseCode: 'CASE #INC-811-09',
    status: 'PENDING',
    level: 'HIGH',
    time: '12:05 UTC',
    title: 'Auth-Service Latency Spike',
    resource: 'K8S-CLUSTER-A',
    description: 'Intermittent latency spike and timeouts in the central gateway authorization microservice due to token decryption cache thrashing under sudden peak loads.',
    aiConfidence: 89,
    rootCauseAnalysis: 'DETECTED: Cryptographic hashing routines executing synchronously on the Web thread, blocking execution loop due to lack of an LRU token cache.',
    sourceFile: 'auth_security.go',
    sourceLine: 289,
    codeSnippet: `// Cryptographic validation routine
func verifyToken(t string) bool {
    tokens.Lock()
    defer tokens.Unlock() `,
    highlightedLine: "return bcrypt.CompareHashAndPassword(hashedBytes, rawBytes)",
    codeSnippetTail: `}`,
    timeline: [
      { id: 't4', time: '12:05:10', title: 'Route latency exceeds 1500ms', description: 'Auth gateway throttled' },
      { id: 't5', time: '12:05:32', title: 'Token crypt analysis batch run', description: 'Cryptographic CPU lock identified' },
      { id: 't6', time: '12:06:01', title: 'Identified repetitive bcrypt calls', description: 'Repetitive decryption loops detected' }
    ],
    latencyProfile: [
      { label: 'T-30M', value: 15 },
      { label: '', value: 25 },
      { label: '', value: 50 },
      { label: 'NOW', value: 92, isCore: true },
      { label: '', value: 65 },
      { label: '', value: 50 },
      { label: '+15M EST', value: 20 }
    ],
    proposedIssue: {
      title: 'Bug: Repetitive Bcrypt hashing throttling authentication workers',
      description: 'Excessive token verification overhead caused by high-frequency compares across redundant JWT decrypters.',
      proposedFix: 'Implement a short-lived memory LRU cache for authenticated validation tokens.',
      labels: ['p1', 'auth-latency']
    }
  },
  {
    id: 'inc-3',
    caseCode: 'CASE #INC-720-11',
    status: 'RESOLVED',
    level: 'MEDIUM',
    time: '09:41 UTC',
    title: 'Staging Deployment Failure',
    resource: 'CI-CD-PIPELINE',
    description: 'GitHub Actions deployment step fails repeatedly due to memory exhaustion during high-stress webpack compiler runs.',
    aiConfidence: 95,
    rootCauseAnalysis: 'DETECTED: Optimization flags trigger multiple sub-threads which collide with hard node-memory environment limitations.',
    sourceFile: 'package.json',
    sourceLine: 12,
    codeSnippet: `"scripts": {
    "postinstall": "npm run build", `,
    highlightedLine: `"build": "node --max-old-space-size=4096 webpack --config webpack.prod.js"`,
    codeSnippetTail: `}`,
    timeline: [
      { id: 't7', time: '09:41:00', title: 'Trigger deployment workflow', description: 'CI pipeline initiated' },
      { id: 't8', time: '09:43:10', title: 'Container builder reports exit 137', description: 'Out of memory event' },
      { id: 't9', time: '09:43:45', title: 'Identified excessive compilation threads', description: 'Compiling size configured incorrectly' }
    ],
    latencyProfile: [
      { label: 'T-30M', value: 10 },
      { label: '', value: 20 },
      { label: '', value: 80 },
      { label: 'NOW', value: 10, isCore: true },
      { label: '', value: 10 },
      { label: '', value: 10 },
      { label: '+15M EST', value: 10 }
    ],
    proposedIssue: {
      title: 'Bug: Incompatible lockfile in build package context',
      description: 'Npm CI failing due to incorrect memory configurations leading to memory leaks.',
      proposedFix: 'Expose webpack max old space size configuration inside staging environment specs.',
      labels: ['p2', 'deploy-failed']
    }
  },
  {
    id: 'inc-4',
    caseCode: 'CASE #INC-502-04',
    status: 'DISMISSED',
    level: 'MEDIUM',
    time: '07:15 UTC',
    title: 'Redis Cache Eviction Surge',
    resource: 'MEMCACHED-02',
    description: 'Sudden spike in eviction counters within the central cache tier due to redundant session metadata with prolonged TTL constraints.',
    aiConfidence: 81,
    rootCauseAnalysis: 'DETECTED: Redis cache policy set to volatile-lru while massive background tasks write persistent non-expiring config objects.',
    sourceFile: 'redis_client.conf',
    sourceLine: 77,
    codeSnippet: `maxmemory 2gb
maxmemory-policy `,
    highlightedLine: "volatile-lru",
    codeSnippetTail: `# Custom expiration defaults for Redis`,
    timeline: [
      { id: 't10', time: '07:15:00', title: 'Cache usage hits 99.8%', description: 'Eviction alert triggered' },
      { id: 't11', time: '07:15:15', title: 'AI Scanner initiates garbage inspect', description: 'Scanning non-expiring objects' },
      { id: 't12', time: '07:16:11', title: 'Eviction policies analyzed', description: 'LRU configuration conflict found' }
    ],
    latencyProfile: [
      { label: 'T-30M', value: 30 },
      { label: '', value: 40 },
      { label: '', value: 60 },
      { label: 'NOW', value: 20, isCore: true },
      { label: '', value: 20 },
      { label: '', value: 20 },
      { label: '+15M EST', value: 20 }
    ],
    proposedIssue: {
      title: 'Performance: Over-extended cache session life TTL',
      description: 'Central cache tier completely saturated with session configs that do not have specified expiry values.',
      proposedFix: 'Reconfigure maxmemory-policy to allkeys-lru and introduce a global threshold limit.',
      labels: ['p2', 'cache-eviction']
    }
  }
];

export const initialWorkflowNodes: WorkflowNode[] = [
  {
    id: 'wf-1',
    type: 'trigger',
    label: 'PagerDuty Alert',
    subText: 'prod-cluster-01',
    icon: 'BellRing',
    x: 10,
    y: 50
  },
  {
    id: 'wf-2',
    type: 'classifier',
    label: 'Classifier Agent',
    subText: 'LLM-Gpt4o-v2',
    status: 'ONLINE',
    latency: '140ms',
    icon: 'GitBranch',
    x: 35,
    y: 50
  },
  {
    id: 'wf-3-1',
    type: 'agent',
    label: 'Root Cause Agent',
    subText: 'K8s-Specialist',
    icon: 'SearchCode',
    x: 65,
    y: 30
  },
  {
    id: 'wf-3-2',
    type: 'agent',
    label: 'Log Analyzer',
    subText: 'CloudWatch-Reader',
    icon: 'Terminal',
    status: 'OFFLINE',
    x: 65,
    y: 70
  },
  {
    id: 'wf-4',
    type: 'resolution',
    label: 'Slack Notify',
    subText: '#ops-critical',
    status: 'STABLE',
    icon: 'Slack',
    x: 90,
    y: 50
  }
];

export const initialRecentFailures: RecentFailure[] = [
  {
    id: 'rf-1',
    service: 'payment-gateway',
    environment: 'Production',
    errorType: 'Timeout 504',
    duration: '14m',
    status: 'CRITICAL'
  },
  {
    id: 'rf-2',
    service: 'user-profile-db',
    environment: 'Staging',
    errorType: 'Connection Refused',
    duration: '2m',
    status: 'RESOLVED'
  },
  {
    id: 'rf-3',
    service: 'cdn-edge-cache',
    environment: 'Production',
    errorType: 'SSL Handshake',
    duration: '45m',
    status: 'ONGOING'
  },
  {
    id: 'rf-4',
    service: 'search-indexer',
    environment: 'Development',
    errorType: 'OOM Kill',
    duration: '8m',
    status: 'WARNING'
  }
];

export const initialMetrics: ExecutiveMetrics = {
  activeIncidentsCount: 12,
  activeIncidentsDelta: '+2',
  failedPipelinesCount: 4,
  failedPipelinesStatus: 'stable',
  aiResolutionRate: 89,
  aiResolutionDelta: '↑ 5%',
  avgRecoveryTime: '18m',
  avgRecoveryDelta: '↓ 12m'
};

export const stepAnalysisLogs = [
  { id: 's1', step: '[1]', text: 'Fetch K8s Pod logs...', status: 'DONE', isGreen: true },
  { id: 's2', step: '[2]', text: 'Parse memory metrics...', status: 'DONE', isGreen: true },
  { id: 's3', step: '[3]', text: 'Cross-ref with Git history...', status: 'RUNNING', isGreen: false },
  { id: 's4', step: '[4]', text: 'Identifying candidate: v2.4.1-rc2', status: 'PENDING', isGreen: false, isItalic: true }
];

export const aiInsights = [
  {
    id: 'ins-a',
    category: 'ANOMALY DETECTED',
    message: "Unusual latency spike in 'auth-service' v2.4. Probability of cascaded failure: 72%.",
    actionText: 'RESOLVE NOW'
  },
  {
    id: 'ins-b',
    category: 'OPTIMIZATION',
    message: "K8s cluster 'pro-east-1' is over-provisioned by 40%. Estimated savings: $4.2k/mo.",
    actionText: 'VIEW PLAN'
  },
  {
    id: 'ins-c',
    category: 'SECURITY ADVISORY',
    message: "Exposed API endpoint detected in 'billing-adapter'. Auto-patching initiated.",
    actionText: null
  }
];
