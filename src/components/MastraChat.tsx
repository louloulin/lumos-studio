import React, { useState, useEffect } from 'react';
import { MastraAPI } from '../api/mastra';

const MastraChat: React.FC = () => {
  const [agents, setAgents] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isServiceRunning, setIsServiceRunning] = useState(false);

  // Check if the Mastra service is running and load agents
  useEffect(() => {
    const checkService = async () => {
      try {
        const running = await MastraAPI.isRunning();
        setIsServiceRunning(running);
        
        if (running) {
          const availableAgents = await MastraAPI.getAgents();
          setAgents(availableAgents);
          if (availableAgents.length > 0 && !selectedAgent) {
            setSelectedAgent(availableAgents[0]);
          }
        }
      } catch (error) {
        console.error('Error checking Mastra service:', error);
        setIsServiceRunning(false);
      }
    };
    
    checkService();
    
    // Set up an interval to check the service status
    const interval = setInterval(checkService, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAgent(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAgent || !input || loading) return;
    
    setLoading(true);
    try {
      const result = await MastraAPI.generate(selectedAgent, {
        messages: [input],
      });
      setResponse(result.text);
    } catch (error) {
      console.error('Error generating response:', error);
      setResponse('Error: Failed to generate a response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isServiceRunning) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h2 className="text-xl font-semibold text-red-800">Mastra Service Not Running</h2>
        <p className="mt-2 text-red-600">
          The Mastra service is not running. Please check your configuration and restart the application.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Mastra Chat</h2>
      
      {agents.length === 0 ? (
        <p className="text-gray-600">No agents available. Please check your Mastra configuration.</p>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="agent" className="block text-sm font-medium text-gray-700">
                Select Agent
              </label>
              <select
                id="agent"
                value={selectedAgent}
                onChange={handleAgentChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {agents.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Your Message
              </label>
              <textarea
                id="message"
                value={input}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md"
                placeholder="Enter your message here..."
              />
            </div>
            
            <button
              type="submit"
              disabled={!selectedAgent || !input || loading}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                !selectedAgent || !input || loading
                  ? 'bg-indigo-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {loading ? 'Generating...' : 'Send'}
            </button>
          </form>
          
          {response && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">Response</h3>
              <div className="mt-2 p-4 bg-gray-50 rounded border border-gray-200 whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MastraChat; 