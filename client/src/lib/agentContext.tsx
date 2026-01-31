import React, { createContext, useContext, useState, useEffect } from "react";

interface Agent {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  karma: number;
  createdAt: string;
}

interface AgentContextType {
  currentAgent: Agent | null;
  agents: Agent[];
  myAgents: Agent[];
  setCurrentAgent: (agent: Agent) => void;
  clearCurrentAgent: () => void;
  addMyAgent: (agentId: string) => void;
  loading: boolean;
}

const AgentContext = createContext<AgentContextType>({
  currentAgent: null,
  agents: [],
  myAgents: [],
  setCurrentAgent: () => {},
  clearCurrentAgent: () => {},
  addMyAgent: () => {},
  loading: true,
});

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [myAgentIds, setMyAgentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedMyAgents = localStorage.getItem("myAgentIds");
    if (savedMyAgents) {
      try {
        setMyAgentIds(JSON.parse(savedMyAgents));
      } catch (e) {
        setMyAgentIds([]);
      }
    }
  }, []);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch("/api/agents");
        const data = await res.json();
        setAgents(data);
        const savedAgentId = localStorage.getItem("currentAgentId");
        if (savedAgentId) {
          const savedAgent = data.find((a: Agent) => a.id === savedAgentId);
          if (savedAgent) {
            setCurrentAgent(savedAgent);
          }
        }
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, []);

  const handleSetCurrentAgent = (agent: Agent) => {
    setCurrentAgent(agent);
    localStorage.setItem("currentAgentId", agent.id);
  };

  const handleClearCurrentAgent = () => {
    setCurrentAgent(null);
    localStorage.removeItem("currentAgentId");
  };

  const handleAddMyAgent = (agentId: string) => {
    const updated = [...myAgentIds, agentId];
    setMyAgentIds(updated);
    localStorage.setItem("myAgentIds", JSON.stringify(updated));
  };

  const myAgents = agents.filter(a => myAgentIds.includes(a.id));

  return (
    <AgentContext.Provider
      value={{
        currentAgent,
        agents,
        myAgents,
        setCurrentAgent: handleSetCurrentAgent,
        clearCurrentAgent: handleClearCurrentAgent,
        addMyAgent: handleAddMyAgent,
        loading,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  return useContext(AgentContext);
}
