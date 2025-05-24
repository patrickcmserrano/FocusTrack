import { writable } from 'svelte/store';
import schedule from '../../data/schedule.json';

export interface Task {
  task: string;
  start: string;
  end: string;
}

export interface TaskLog {
  timestamp: string;
  duration: number;
}

export interface TaskLogs {
  [task: string]: { count: number; totalHours: number; entries: TaskLog[] };
}

// Store para gerenciar tarefas e logs
export const taskLogsStore = writable<TaskLogs>(loadTaskLogs());

// Função para obter tarefas para um dia específico
export function getTasksForDay(day: string): Task[] {
  return schedule.days[day as keyof typeof schedule.days] || [];
}

// Função para obter a tarefa atual baseada na hora atual
export function getCurrentTask(now: Date, day: string): Task | null {
  const currentTime = now.toTimeString().slice(0, 5);
  return getTasksForDay(day).find(task => 
    task.start <= currentTime && currentTime < task.end
  ) || null;
}

// Carregar logs de tarefas do localStorage
function loadTaskLogs(): TaskLogs {
  if (typeof localStorage === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('taskLogs') || '{}');
  } catch (e) {
    console.error('Erro ao carregar logs de tarefas:', e);
    return {};
  }
}

// Salvar um novo log de tarefa
export function saveTaskLog(task: string, timestamp: string, duration: number) {
  taskLogsStore.update(logs => {
    if (!logs[task]) {
      logs[task] = { count: 0, totalHours: 0, entries: [] };
    }
    logs[task].count += 1;
    logs[task].totalHours += duration;
    logs[task].entries.push({ timestamp, duration });
    
    // Salvar no localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('taskLogs', JSON.stringify(logs));
    }
    
    return logs;
  });
}

// Remover o log de tarefa mais recente
export function removeLastTaskLog(task: string) {
  taskLogsStore.update(logs => {
    if (logs[task] && logs[task].entries.length > 0) {
      // Remover a entrada mais recente
      const lastEntry = logs[task].entries.pop();
      if (lastEntry) {
        logs[task].count -= 1;
        logs[task].totalHours -= lastEntry.duration;
        
        // Se não houver mais entradas, remover a tarefa completamente
        if (logs[task].count === 0) {
          delete logs[task];
        }
        
        // Salvar no localStorage
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('taskLogs', JSON.stringify(logs));
        }
      }
    }
    
    return logs;
  });
}

// Obter todos os logs de tarefas
export function getTaskLogs(): TaskLogs {
  let logs: TaskLogs = {};
  
  taskLogsStore.subscribe(value => {
    logs = value;
  })();
  
  return logs;
}

// Verificar notificações para a hora atual
export function checkNotifications(currentDay: string, currentTime: string): { message: string } | null {
  const notification = schedule.notifications.find(
    (n: { day: string; time: string; message: string }) => n.day === currentDay && n.time === currentTime
  );
  
  return notification ? { message: notification.message } : null;
}
