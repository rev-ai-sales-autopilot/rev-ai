'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Pause,
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Settings,
  Bot,
  Zap,
  Clock,
  HelpCircle,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  WorkflowStatus,
  WorkflowNodeType,
  WorkflowTriggerType,
  AIOperationType,
  ActionType,
  ConditionOperator,
} from '@/types/workflow';

interface NodeItem {
  id: string;
  type: WorkflowNodeType;
  name: string;
  config: Record<string, unknown>;
  position_x: number;
  position_y: number;
}

interface EdgeItem {
  id?: string;
  source_node_id: string;
  target_node_id: string;
  condition?: string;
}

interface WorkflowDetail {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  version: number;
  nodes: NodeItem[];
  edges: EdgeItem[];
  execution_count: number;
  last_run_at?: string | null;
}

export default function WorkflowBuilderPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = use(params);

  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);
  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active configuration drawer state
  const [editingNodeIndex, setEditingNodeIndex] = useState<number | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadWorkflow() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/workflows/${workflowId}`);
        const json = await res.json();

        if (!isCancelled) {
          if (json.success && json.data) {
            setWorkflow(json.data);
            setNodes(json.data.nodes || []);
          } else {
            setError(json.error?.message || 'Failed to load workflow');
          }
        }
      } catch {
        if (!isCancelled) {
          setError('Network connection error');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadWorkflow();

    return () => {
      isCancelled = true;
    };
  }, [workflowId]);

  async function handleSave(newStatus?: WorkflowStatus) {
    if (!workflow) return;

    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);

      const targetStatus = newStatus || workflow.status;

      // Generate edges sequentially for vertical node graph
      const generatedEdges: EdgeItem[] = [];
      for (let i = 0; i < nodes.length - 1; i++) {
        generatedEdges.push({
          source_node_id: nodes[i].id,
          target_node_id: nodes[i + 1].id,
        });
      }

      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workflow.name,
          description: workflow.description,
          status: targetStatus,
          nodes: nodes.map((n, idx) => ({
            id: n.id,
            type: n.type,
            name: n.name,
            config: n.config,
            position_x: 100,
            position_y: (idx + 1) * 100,
          })),
          edges: generatedEdges,
        }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        setWorkflow((prev) => (prev ? { ...prev, status: targetStatus } : null));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(json.error?.message || 'Failed to save workflow changes');
      }
    } catch {
      setError('Network connection error while saving');
    } finally {
      setSaving(false);
    }
  }

  function addNode(type: WorkflowNodeType) {
    const nodeLabels: Record<WorkflowNodeType, string> = {
      TRIGGER: 'Trigger Event',
      AI: 'AI Analysis Node',
      CONDITION: 'Logic Condition',
      ACTION: 'Action Handler',
      DELAY: 'Time Delay',
    };

    const defaultConfig: Record<WorkflowNodeType, Record<string, unknown>> = {
      TRIGGER: { triggerType: 'LEAD_CREATED' },
      AI: { operation: 'ANALYZE', targetField: 'score' },
      CONDITION: { field: 'lead.score', operator: '>', value: '80' },
      ACTION: { actionType: 'ASSIGN_LEAD' },
      DELAY: { delayMinutes: 15 },
    };

    const newNode: NodeItem = {
      id: 'temp-' + crypto.randomUUID(),
      type,
      name: nodeLabels[type],
      config: defaultConfig[type],
      position_x: 100,
      position_y: (nodes.length + 1) * 100,
    };

    setNodes([...nodes, newNode]);
    setEditingNodeIndex(nodes.length);
  }

  function moveNode(index: number, direction: 'UP' | 'DOWN') {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= nodes.length) return;

    const newNodes = [...nodes];
    const [moved] = newNodes.splice(index, 1);
    newNodes.splice(targetIndex, 0, moved);
    setNodes(newNodes);

    if (editingNodeIndex === index) {
      setEditingNodeIndex(targetIndex);
    }
  }

  function deleteNode(index: number) {
    const newNodes = nodes.filter((_, i) => i !== index);
    setNodes(newNodes);
    if (editingNodeIndex === index) {
      setEditingNodeIndex(null);
    } else if (editingNodeIndex !== null && editingNodeIndex > index) {
      setEditingNodeIndex(editingNodeIndex - 1);
    }
  }

  function updateNodeConfig(index: number, updatedName: string, updatedConfig: Record<string, unknown>) {
    const newNodes = [...nodes];
    newNodes[index] = {
      ...newNodes[index],
      name: updatedName,
      config: updatedConfig,
    };
    setNodes(newNodes);
  }

  if (loading) {
    return (
      <div className="border-sharp bg-white p-12 text-center flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
        <span className="text-xs font-bold uppercase tracking-wider">Loading Workflow Builder...</span>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="border-sharp bg-white p-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-xl font-extrabold uppercase">Workflow Not Found</h2>
        <p className="text-xs text-black/60">The requested workflow does not exist or access is restricted.</p>
        <Link href="/dashboard/workflows" className="btn-pill-primary text-xs uppercase">
          Back to Workflows
        </Link>
      </div>
    );
  }

  const activeNode = editingNodeIndex !== null ? nodes[editingNodeIndex] : null;

  return (
    <div className="space-y-8">
      {/* Builder Header & Controls */}
      <div className="border-b border-black pb-6 space-y-4">
        <Link
          href="/dashboard/workflows"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-black/70 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Workflows
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                {workflow.name}
              </h1>

              {workflow.status === 'ACTIVE' && (
                <span className="inline-flex items-center gap-1 bg-[#12B76A]/20 text-[#123B2D] border border-[#12B76A] px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
                  <Play className="w-2.5 h-2.5 fill-current" /> Active
                </span>
              )}
              {workflow.status === 'DRAFT' && (
                <span className="inline-flex items-center gap-1 bg-black/10 text-black border border-black/30 px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
                  <FileText className="w-2.5 h-2.5" /> Draft
                </span>
              )}
              {workflow.status === 'PAUSED' && (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-400 px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
                  <Pause className="w-2.5 h-2.5" /> Paused
                </span>
              )}
            </div>

            <p className="text-xs font-medium text-black/70">
              {workflow.description || 'Structured vertical workflow automation graph.'}
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="btn-editorial-secondary py-2 px-4 text-xs uppercase flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>

            {workflow.status !== 'ACTIVE' ? (
              <button
                onClick={() => handleSave('ACTIVE')}
                disabled={saving}
                className="btn-pill-primary py-2 px-4 text-xs uppercase bg-[#12B76A] hover:bg-[#123B2D] hover:text-white text-black"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Activate
              </button>
            ) : (
              <button
                onClick={() => handleSave('PAUSED')}
                disabled={saving}
                className="btn-editorial-secondary py-2 px-4 text-xs uppercase bg-amber-200 text-amber-900 border-amber-400"
              >
                <Pause className="w-3.5 h-3.5" /> Pause
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="border-sharp bg-red-50 p-4 text-xs font-bold text-red-700">
          {error}
        </div>
      )}
      {saveSuccess && (
        <div className="border-sharp bg-[#12B76A]/10 border-[#12B76A] p-4 text-xs font-bold text-[#123B2D] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#12B76A]" /> Workflow saved successfully to database.
        </div>
      )}

      {/* Main Builder Grid: Node Graph (Left) + Config Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Node Graph Area */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between border-sharp bg-white p-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-black">
              WORKFLOW NODE PIPELINE
            </span>
            <span className="text-[11px] font-mono text-black/60">{nodes.length} Nodes Configured</span>
          </div>

          {nodes.length === 0 ? (
            <div className="border-sharp bg-white p-8 text-center space-y-3">
              <HelpCircle className="w-8 h-8 text-black/40 mx-auto" />
              <p className="text-xs font-bold uppercase">No nodes in workflow graph</p>
              <p className="text-[11px] text-black/60">Click the buttons below to add nodes to this workflow.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {nodes.map((node, index) => {
                const isSelected = editingNodeIndex === index;

                return (
                  <div key={node.id} className="flex flex-col items-center">
                    {/* Node Card */}
                    <div
                      onClick={() => setEditingNodeIndex(index)}
                      className={`w-full border-sharp p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-black text-white shadow-lg'
                          : 'bg-white text-black hover:border-black'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {/* Node Type Icon */}
                          <div
                            className={`w-8 h-8 flex items-center justify-center font-bold text-xs ${
                              node.type === 'TRIGGER'
                                ? 'bg-[#12B76A] text-black'
                                : node.type === 'AI'
                                ? 'bg-[#20C8E8] text-black'
                                : node.type === 'CONDITION'
                                ? 'bg-[#F4B62A] text-black'
                                : node.type === 'ACTION'
                                ? 'bg-[#F5A7D7] text-black'
                                : 'bg-slate-300 text-black'
                            }`}
                          >
                            {node.type === 'TRIGGER' && <Zap className="w-4 h-4" />}
                            {node.type === 'AI' && <Bot className="w-4 h-4" />}
                            {node.type === 'CONDITION' && <HelpCircle className="w-4 h-4" />}
                            {node.type === 'ACTION' && <Settings className="w-4 h-4" />}
                            {node.type === 'DELAY' && <Clock className="w-4 h-4" />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">
                                Step {index + 1} • {node.type}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-sm uppercase">{node.name}</h4>
                          </div>
                        </div>

                        {/* Node Controls */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveNode(index, 'UP');
                            }}
                            disabled={index === 0}
                            className="p-1 hover:bg-white/20 text-current disabled:opacity-20"
                            title="Move Up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveNode(index, 'DOWN');
                            }}
                            disabled={index === nodes.length - 1}
                            className="p-1 hover:bg-white/20 text-current disabled:opacity-20"
                            title="Move Down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNode(index);
                            }}
                            className="p-1 hover:bg-red-500 hover:text-white text-current transition-colors ml-1"
                            title="Delete Node"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Connecting Connector Arrow */}
                    {index < nodes.length - 1 && (
                      <div className="my-1 flex flex-col items-center text-black/40">
                        <div className="w-0.5 h-4 bg-black/20" />
                        <ChevronDown className="w-4 h-4 -mt-1" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Node Controls Toolbar */}
          <div className="border-sharp bg-white p-4 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-black/60 block">
              ADD NEXT NODE STEP
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => addNode('TRIGGER')}
                className="btn-editorial-secondary py-1.5 px-3 text-xs uppercase flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> + Trigger
              </button>
              <button
                onClick={() => addNode('AI')}
                className="btn-editorial-secondary py-1.5 px-3 text-xs uppercase flex items-center gap-1 bg-[#20C8E8]/10 border-[#20C8E8]"
              >
                <Plus className="w-3.5 h-3.5" /> + AI Node
              </button>
              <button
                onClick={() => addNode('CONDITION')}
                className="btn-editorial-secondary py-1.5 px-3 text-xs uppercase flex items-center gap-1 bg-[#F4B62A]/10 border-[#F4B62A]"
              >
                <Plus className="w-3.5 h-3.5" /> + Condition
              </button>
              <button
                onClick={() => addNode('ACTION')}
                className="btn-editorial-secondary py-1.5 px-3 text-xs uppercase flex items-center gap-1 bg-[#F5A7D7]/10 border-[#F5A7D7]"
              >
                <Plus className="w-3.5 h-3.5" /> + Action
              </button>
              <button
                onClick={() => addNode('DELAY')}
                className="btn-editorial-secondary py-1.5 px-3 text-xs uppercase flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> + Delay
              </button>
            </div>
          </div>
        </div>

        {/* Node Configuration Panel (Right Column) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border-sharp bg-white p-6 space-y-6">
            <div className="border-b border-black pb-4">
              <h3 className="font-black text-sm uppercase tracking-tight text-black">
                NODE CONFIGURATION
              </h3>
              <p className="text-[11px] font-medium text-black/60 mt-0.5">
                {activeNode ? `Editing Step ${editingNodeIndex! + 1}` : 'Select a node on the left to configure.'}
              </p>
            </div>

            {activeNode && editingNodeIndex !== null ? (
              <div className="space-y-6">
                {/* Node Label Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-black">
                    Step Name
                  </label>
                  <input
                    type="text"
                    value={activeNode.name}
                    onChange={(e) =>
                      updateNodeConfig(editingNodeIndex, e.target.value, activeNode.config)
                    }
                    className="w-full p-2.5 text-xs font-semibold bg-[#F1F2F3] border-sharp focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                {/* Specific Config by Node Type */}
                {activeNode.type === 'TRIGGER' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-black">
                      Trigger Event Type
                    </label>
                    <select
                      value={(activeNode.config.triggerType as string) || 'LEAD_CREATED'}
                      onChange={(e) =>
                        updateNodeConfig(editingNodeIndex, activeNode.name, {
                          ...activeNode.config,
                          triggerType: e.target.value as WorkflowTriggerType,
                        })
                      }
                      className="w-full p-2.5 text-xs font-semibold bg-[#F1F2F3] border-sharp focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="LEAD_CREATED">Lead Created</option>
                      <option value="LEAD_UPDATED">Lead Updated</option>
                      <option value="FORM_SUBMITTED">Form Submitted</option>
                      <option value="MESSAGE_RECEIVED">Message Received</option>
                      <option value="MEETING_COMPLETED">Meeting Completed</option>
                      <option value="PAYMENT_RECEIVED">Payment Received</option>
                      <option value="WEBHOOK_RECEIVED">Inbound Webhook</option>
                      <option value="SCHEDULED">Scheduled Cron</option>
                    </select>
                  </div>
                )}

                {activeNode.type === 'AI' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-black">
                        AI Operation
                      </label>
                      <select
                        value={(activeNode.config.operation as string) || 'ANALYZE'}
                        onChange={(e) =>
                          updateNodeConfig(editingNodeIndex, activeNode.name, {
                            ...activeNode.config,
                            operation: e.target.value as AIOperationType,
                          })
                        }
                        className="w-full p-2.5 text-xs font-semibold bg-[#F1F2F3] border-sharp focus:outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="ANALYZE">ANALYZE (Lead Heat & Intent)</option>
                        <option value="CLASSIFY">CLASSIFY (Categorize Requirement)</option>
                        <option value="EXTRACT">EXTRACT (Parse Contact Metadata)</option>
                        <option value="SUMMARIZE">SUMMARIZE (Conversation Summary)</option>
                        <option value="GENERATE">GENERATE (Compose Personalized Reply)</option>
                        <option value="SCORE">SCORE (Calculate Fit Score 0-100)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-black">
                        Target Field / Prompt Instruction
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Optional prompt guidance for AI engine..."
                        value={(activeNode.config.promptTemplate as string) || ''}
                        onChange={(e) =>
                          updateNodeConfig(editingNodeIndex, activeNode.name, {
                            ...activeNode.config,
                            promptTemplate: e.target.value,
                          })
                        }
                        className="w-full p-2.5 text-xs font-semibold bg-[#F1F2F3] border-sharp focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>
                  </div>
                )}

                {activeNode.type === 'CONDITION' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase tracking-wider text-black">
                        Field Key
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. lead.score"
                        value={(activeNode.config.field as string) || 'lead.score'}
                        onChange={(e) =>
                          updateNodeConfig(editingNodeIndex, activeNode.name, {
                            ...activeNode.config,
                            field: e.target.value,
                          })
                        }
                        className="w-full p-2.5 text-xs font-semibold bg-[#F1F2F3] border-sharp focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-wider text-black">
                          Operator
                        </label>
                        <select
                          value={(activeNode.config.operator as string) || '>'}
                          onChange={(e) =>
                            updateNodeConfig(editingNodeIndex, activeNode.name, {
                              ...activeNode.config,
                              operator: e.target.value as ConditionOperator,
                            })
                          }
                          className="w-full p-2.5 text-xs font-semibold bg-[#F1F2F3] border-sharp focus:outline-none focus:ring-2 focus:ring-black"
                        >
                          <option value="==">Equal (==)</option>
                          <option value="!=">Not Equal (!=)</option>
                          <option value=">">Greater Than (&gt;)</option>
                          <option value="<">Less Than (&lt;)</option>
                          <option value=">=">Greater or Equal (&gt;=)</option>
                          <option value="<=">Less or Equal (&lt;=)</option>
                          <option value="contains">Contains</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-wider text-black">
                          Value
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 80"
                          value={(activeNode.config.value as string) || '80'}
                          onChange={(e) =>
                            updateNodeConfig(editingNodeIndex, activeNode.name, {
                              ...activeNode.config,
                              value: e.target.value,
                            })
                          }
                          className="w-full p-2.5 text-xs font-semibold bg-[#F1F2F3] border-sharp focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeNode.type === 'ACTION' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-black">
                      Action Type
                    </label>
                    <select
                      value={(activeNode.config.actionType as string) || 'ASSIGN_LEAD'}
                      onChange={(e) =>
                        updateNodeConfig(editingNodeIndex, activeNode.name, {
                          ...activeNode.config,
                          actionType: e.target.value as ActionType,
                        })
                      }
                      className="w-full p-2.5 text-xs font-semibold bg-[#F1F2F3] border-sharp focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="UPDATE_LEAD">UPDATE_LEAD (Set Status / Heat)</option>
                      <option value="ASSIGN_LEAD">ASSIGN_LEAD (Route to Sales User)</option>
                      <option value="CREATE_TASK">CREATE_TASK (Schedule Followup)</option>
                      <option value="SEND_NOTIFICATION">SEND_NOTIFICATION (Internal Alert)</option>
                      <option value="WEBHOOK">WEBHOOK (Dispatch to n8n / External API)</option>
                    </select>
                  </div>
                )}

                {activeNode.type === 'DELAY' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-wider text-black">
                      Delay Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={(activeNode.config.delayMinutes as number) || 15}
                      onChange={(e) =>
                        updateNodeConfig(editingNodeIndex, activeNode.name, {
                          ...activeNode.config,
                          delayMinutes: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full p-2.5 text-xs font-semibold bg-[#F1F2F3] border-sharp focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs font-medium text-black/50 space-y-2">
                <p>Click on any node step in the pipeline to edit its configuration parameters.</p>
              </div>
            )}
          </div>

          {/* Execution History Stats Box */}
          <div className="border-sharp bg-white p-6 space-y-4">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-black">
              EXECUTION STATISTICS
            </h4>
            <div className="p-4 bg-[#F1F2F3] border-sharp space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-black/60">Total Runs:</span>
                <span className="font-bold text-black">{workflow.execution_count} executions</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black/60">Last Execution:</span>
                <span className="text-black/80">
                  {workflow.last_run_at ? new Date(workflow.last_run_at).toLocaleString() : 'No executions recorded yet'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
