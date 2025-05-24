import { writable } from 'svelte/store';

// Store para controlar o tempo do Pomodoro
export const pomodoroTime = writable<number>(25);
export const isRunning = writable<boolean>(false);
export const currentTask = writable<string>('');

// Configurações do Pomodoro (em minutos)
const POMODORO_DURATION = 25;
const SHORT_BREAK_DURATION = 5;
const LONG_BREAK_DURATION = 15;

let interval: ReturnType<typeof setInterval> | null = null;
let breakCount = 0;

// Inicia o timer Pomodoro
export function startPomodoro(taskName: string) {
  if (interval) clearInterval(interval);
  
  pomodoroTime.set(POMODORO_DURATION);
  isRunning.set(true);
  currentTask.set(taskName);
  
  interval = setInterval(() => {
    pomodoroTime.update(time => {
      if (time <= 0) {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Pomodoro concluído!', {
            body: `Você completou um pomodoro para a tarefa: ${taskName}`,
            icon: '/vite.svg'
          });
        }
        
        stopPomodoro();
        return POMODORO_DURATION;
      }
      return time - (1/60); // Decrementa 1 segundo (1/60 de minuto)
    });
  }, 1000);
}

// Para o timer Pomodoro
export function stopPomodoro() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
  
  isRunning.set(false);
  currentTask.set('');
}

// Reinicia o timer Pomodoro
export function resetPomodoro() {
  stopPomodoro();
  pomodoroTime.set(POMODORO_DURATION);
}

// Inicia um intervalo após completar um Pomodoro
export function startBreak() {
  breakCount++;
  const isLongBreak = breakCount % 4 === 0;
  const breakDuration = isLongBreak ? LONG_BREAK_DURATION : SHORT_BREAK_DURATION;
  
  if (interval) clearInterval(interval);
  
  pomodoroTime.set(breakDuration);
  isRunning.set(true);
  
  interval = setInterval(() => {
    pomodoroTime.update(time => {
      if (time <= 0) {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Intervalo terminado!', {
            body: 'Hora de voltar ao trabalho',
            icon: '/vite.svg'
          });
        }
        
        stopPomodoro();
        return POMODORO_DURATION;
      }
      return time - (1/60);
    });
  }, 1000);
}

// Solicita permissão para notificações
export function requestNotificationPermission() {
  if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}
