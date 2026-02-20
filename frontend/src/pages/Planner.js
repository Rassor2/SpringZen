import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Check, Loader2, Plus, Trash2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Planner = () => {
  const { user, loading: authLoading, login } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskArea, setNewTaskArea] = useState("General");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (user) {
        fetchTasks();
    } else if (!authLoading) {
        setLoading(false);
    }
  }, [user, authLoading]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/tasks`, { withCredentials: true });
      setTasks(res.data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
      toast.error("Could not load tasks.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId, currentStatus) => {
    // Optimistic update
    const updatedTasks = tasks.map(t => 
        t.id === taskId ? { ...t, is_completed: !currentStatus } : t
    );
    setTasks(updatedTasks);

    try {
      await axios.post(`${API}/tasks/toggle`, { task_id: taskId }, { withCredentials: true });
      // toast.success("Task updated"); // Optional toast, maybe too noisy
    } catch (error) {
      console.error("Toggle failed", error);
      toast.error("Failed to update task");
      // Revert
      setTasks(tasks);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
        setIsAdding(true);
        const res = await axios.post(`${API}/tasks/add`, {
            title: newTaskTitle,
            area: newTaskArea
        }, { withCredentials: true });
        
        // Add new task to state
        setTasks([...tasks, { ...res.data, is_completed: false }]);
        setNewTaskTitle("");
        toast.success("Task added successfully");
    } catch (error) {
        console.error("Add failed", error);
        toast.error("Failed to add task");
    } finally {
        setIsAdding(false);
    }
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.is_completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  // Group tasks by area
  const groupedTasks = tasks.reduce((acc, task) => {
    const area = task.area || "General";
    if (!acc[area]) acc[area] = [];
    acc[area].push(task);
    return acc;
  }, {});

  if (authLoading) {
     return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-emerald-600" size={40} />
        </div>
    );
  }

  if (!user) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-stone-50">
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-stone-100 max-w-md w-full">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                    <Lock size={32} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-stone-800 mb-4">Personal Planner</h2>
                <p className="text-stone-600 mb-8">
                    Login to access your private spring cleaning checklist, track your progress, and add your own custom tasks.
                </p>
                <button 
                    onClick={login}
                    className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-md"
                >
                    Login to Start Planning
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="bg-stone-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-stone-800">Your Spring Cleaning Plan</h1>
                    <p className="text-stone-600 mt-2">Welcome back, {user.name.split(' ')[0]}. You're doing great!</p>
                </div>
                <div className="text-right">
                    <span className="text-sm font-medium text-stone-500 uppercase tracking-wider">Progress</span>
                    <div className="text-3xl font-bold text-emerald-600">{calculateProgress()}%</div>
                </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-stone-200 rounded-full h-4 overflow-hidden shadow-inner">
                <div 
                    className="bg-emerald-500 h-4 rounded-full transition-all duration-700 ease-out relative"
                    style={{ width: `${calculateProgress()}%` }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
            </div>
        </div>
        
        {/* Add Task Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 mb-8">
            <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                <Plus size={18} className="text-emerald-600"/> Add Personal Task
            </h3>
            <form onSubmit={handleAddTask} className="flex flex-col md:flex-row gap-4">
                <input 
                    type="text" 
                    placeholder="What else needs cleaning?" 
                    className="flex-grow px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-stone-50"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    required
                />
                <select 
                    className="px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50"
                    value={newTaskArea}
                    onChange={(e) => setNewTaskArea(e.target.value)}
                >
                    <option value="General">General</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Bedroom">Bedroom</option>
                    <option value="Living Room">Living Room</option>
                    <option value="Bathroom">Bathroom</option>
                    <option value="Office">Office</option>
                    <option value="Outdoor">Outdoor</option>
                </select>
                <button 
                    type="submit" 
                    disabled={isAdding || !newTaskTitle.trim()}
                    className="px-6 py-3 bg-stone-800 hover:bg-stone-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    {isAdding ? <Loader2 className="animate-spin" /> : "Add Task"}
                </button>
            </form>
        </div>

        <div className="space-y-8">
            {Object.keys(groupedTasks).length === 0 && !loading && (
                <div className="text-center py-12 text-stone-500">
                    No tasks found. Try adding one!
                </div>
            )}

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
                            const isCompleted = task.is_completed;
                            return (
                                <div 
                                    key={task.id} 
                                    onClick={() => toggleTask(task.id, isCompleted)}
                                    className={`px-6 py-4 flex items-start gap-4 cursor-pointer transition-colors hover:bg-stone-50 group ${isCompleted ? 'bg-stone-50/50' : ''}`}
                                >
                                    <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        isCompleted 
                                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                                            : 'border-stone-300 text-transparent group-hover:border-emerald-400'
                                    }`}>
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <h3 className={`font-medium text-stone-800 transition-all ${isCompleted ? 'line-through text-stone-400' : ''}`}>
                                                {task.title}
                                            </h3>
                                            {!task.is_global && (
                                                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded ml-2">
                                                    Custom
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-sm mt-1 transition-all ${isCompleted ? 'text-stone-300' : 'text-stone-500'}`}>
                                            {task.description}
                                        </p>
                                        <div className="flex gap-3 mt-2">
                                            {task.estimated_time && (
                                                <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                                                    {task.estimated_time}
                                                </span>
                                            )}
                                            {task.difficulty && (
                                                <span className={`text-xs px-2 py-0.5 rounded ${
                                                    task.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                                    task.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {task.difficulty}
                                                </span>
                                            )}
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
