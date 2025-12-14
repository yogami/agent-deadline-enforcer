'use client';

import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [breached, setBreached] = useState<any[]>([]);

  // Form status
  const [agentId, setAgentId] = useState('agent-123');
  const [desc, setDesc] = useState('Critical computation task');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 3600000).toISOString().slice(0, 16));
  const [msg, setMsg] = useState('');

  const registerTask = async () => {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/tasks/register', {
        method: 'POST',
        body: JSON.stringify({ agentId, description: desc, deadline, slaPolicy: 'STRICT' }),
      });
      if (res.ok) setMsg('✅ Task Registered');
      else setMsg('❌ Error registering');
    } catch (e) { setMsg('❌ Network Error'); }
    setLoading(false);
  };

  const checkBreaches = async () => {
    const res = await fetch('/api/tasks/check', { method: 'POST' });
    const data = await res.json();
    setBreached(data.breachedTasks || []);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Agent Deadline Enforcer
          </h1>
          <p className="text-gray-400 mt-2">SLA Monitoring & Enforcement</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Register */}
          <section className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
            <h2 className="text-xl font-bold text-orange-400">📝 Register Contract</h2>
            <input
              value={agentId} onChange={e => setAgentId(e.target.value)}
              className="w-full bg-black border border-gray-700 p-2 rounded"
              placeholder="Agent ID"
            />
            <input
              value={desc} onChange={e => setDesc(e.target.value)}
              className="w-full bg-black border border-gray-700 p-2 rounded"
              placeholder="Description"
            />
            <input
              type="datetime-local"
              value={deadline} onChange={e => setDeadline(e.target.value)}
              className="w-full bg-black border border-gray-700 p-2 rounded"
            />
            <button
              onClick={registerTask}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 p-2 rounded font-bold hover:opacity-90"
            >
              {loading ? '...' : 'Register Task'}
            </button>
            {msg && <div className="text-center font-mono">{msg}</div>}
          </section>

          {/* Monitor */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-red-500">🚨 SLA Breaches</h2>
              <button
                onClick={checkBreaches}
                className="bg-gray-800 hover:bg-gray-700 px-4 py-1 rounded text-sm"
              >
                Scan Now
              </button>
            </div>

            <div className="space-y-3">
              {breached.length === 0 && <div className="text-gray-500 italic">No breached tasks found.</div>}
              {breached.map((task: any) => (
                <div key={task.id} className="bg-red-950/30 border border-red-900 p-4 rounded text-sm">
                  <div className="font-bold text-red-400">{task.agentId}</div>
                  <div className="text-gray-400">{task.description}</div>
                  <div className="text-xs text-red-300 mt-2 font-mono">
                    Deadline: {new Date(task.deadline).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
