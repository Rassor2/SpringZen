import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Planner = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState(() => {
    // Load from local storage on init
    const saved = localStorage.getItem('completedTasks');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    // Save to local storage whenever changed
    localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
  }, [completedTasks]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API}/tasks`);
      setTasks(res.data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
      toast.error("Could not load tasks.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (taskId) => {
    if (completedTasks.includes(taskId)) {
      setCompletedTasks(completedTasks.filter(id => id !== taskId));
    } else {
      setCompletedTasks([...completedTasks, taskId]);
      toast.success("Task completed! Keep it up!");
    }
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    return Math.round((completedTasks.length / tasks.length) * 100);
  };

  // Group tasks by area
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.area]) acc[task.area] = [];
    acc[task.area].push(task);
    return acc;
  }, {});

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-emerald-600" size={40} />
        </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
            <h1 className="text-3xl font-serif font-bold text-stone-800 mb-4">Your Spring Cleaning Plan</h1>
            <p className="text-stone-600 mb-6">Track your progress as you declutter and refresh your home.</p>
            
            {/* Progress Bar */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
                <div className="flex justify-between items-end mb-2">
                    <span className="font-bold text-stone-700">Total Progress</span>
                    <span className="text-emerald-600 font-bold text-xl">{calculateProgress()}%</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-3 overflow-hidden">
                    <div 
                        className="bg-emerald-500 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${calculateProgress()}%` }}
                    ></div>
                </div>
            </div>
        </div>

        <div className="space-y-8">
            {Object.keys(groupedTasks).map(area => (
                <div key={area} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                    <div className="bg-emerald-50/50 px-6 py-4 border-b border-stone-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-stone-800">{area}</h2>
                        <span className="text-xs font-medium px-3 py-1 bg-white rounded-full text-stone-500 border border-stone-200">
                            {groupedTasks[area].length} Tasks
                        </span>
                    </div>
                    <div className="divide-y divide-stone-50">
                        {groupedTasks[area].map(task => {
                            const isCompleted = completedTasks.includes(task.id);
                            return (
                                <div 
                                    key={task.id} 
                                    onClick={() => toggleTask(task.id)}
                                    className={`px-6 py-4 flex items-start gap-4 cursor-pointer transition-colors hover:bg-stone-50 ${isCompleted ? 'bg-stone-50/50' : ''}`}
                                >
                                    <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        isCompleted 
                                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                                            : 'border-stone-300 text-transparent hover:border-emerald-400'
                                    }`}>
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className={`font-medium text-stone-800 transition-all ${isCompleted ? 'line-through text-stone-400' : ''}`}>
                                            {task.title}
                                        </h3>
                                        <p className={`text-sm mt-1 transition-all ${isCompleted ? 'text-stone-300' : 'text-stone-500'}`}>
                                            {task.description}
                                        </p>
                                        <div className="flex gap-3 mt-2">
                                            <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                                                {task.estimated_time}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${
                                                task.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                                task.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {task.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Planner;
