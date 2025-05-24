<script lang="ts">
  import './styles/global.css';
  import { onMount } from 'svelte';
  import ThemeToggle from './components/ThemeToggle.svelte';
  import LanguageSelector from './components/LanguageSelector.svelte';
  
  // Importações das stores
  import { 
    getTasksForDay, 
    getCurrentTask, 
    saveTaskLog, 
    removeLastTaskLog,
    taskLogsStore, 
    checkNotifications,
    type Task
  } from './lib/stores/ScheduleStore';
  
  import { 
    pomodoroTime, 
    isRunning,
    currentTask as pomodoroTask,
    startPomodoro, 
    stopPomodoro, 
    requestNotificationPermission
  } from './lib/stores/PomodoroTimer';

  // Gerenciamento de data e hora
  let now = new Date();
  let currentDay = "";
  let tomorrowDay = "";
  let todayTasks: Task[] = [];
  let tomorrowTasks: Task[] = [];
  let currentTaskItem: Task | null = null;
  
  // Solicitar permissão para notificações
  onMount(() => {
    requestNotificationPermission();
    
    // Atualizar hora a cada minuto
    const interval = setInterval(() => {
      updateDateTime();
    }, 60000); // a cada minuto
    
    // Inicializar os dados
    updateDateTime();
    
    return () => clearInterval(interval);
  });
  
  // Função para atualizar data e hora e as tarefas relacionadas
  function updateDateTime() {
    now = new Date();
    
    // Ajustar para timezone -03:00
    const localTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    
    // Obter dia atual e amanhã em inglês para mapear com o JSON
    currentDay = localTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const tomorrow = new Date(localTime.getTime() + 24 * 60 * 60 * 1000);
    tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Obter tarefas de hoje e amanhã
    todayTasks = getTasksForDay(currentDay);
    tomorrowTasks = getTasksForDay(tomorrowDay);
    currentTaskItem = getCurrentTask(localTime, currentDay);
    
    // Verificar notificações
    const timeString = localTime.toTimeString().slice(0, 5);
    const notification = checkNotifications(currentDay, timeString);
    
    if (notification && Notification.permission === 'granted') {
      new Notification(notification.message);
    }
  }
  
  // Função para formatar dia da semana em português
  function formatWeekday(day: string): string {
    const translations = {
      'monday': 'Segunda-feira',
      'tuesday': 'Terça-feira',
      'wednesday': 'Quarta-feira',
      'thursday': 'Quinta-feira',
      'friday': 'Sexta-feira',
      'saturday': 'Sábado',
      'sunday': 'Domingo'
    };
    return translations[day as keyof typeof translations] || day;
  }
  
  // Função para completar uma tarefa
  function completeTask(task: Task) {
    const startTime = new Date(`1970-01-01T${task.start}:00`);
    const endTime = new Date(`1970-01-01T${task.end}:00`);
    
    // Calcular duração em horas
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    // Salvar no log
    saveTaskLog(task.task, now.toISOString(), durationHours);
    
    // Parar o pomodoro se estiver rodando para esta tarefa
    if ($isRunning && $pomodoroTask === task.task) {
      stopPomodoro();
    }
  }
  
  // Função para iniciar/parar o Pomodoro para uma tarefa
  function togglePomodoro(task: string) {
    if ($isRunning && $pomodoroTask === task) {
      stopPomodoro();
    } else {
      startPomodoro(task);
    }
  }
  
  // Função para desfazer a conclusão acidental de uma tarefa
  function undoTaskCompletion(taskName: string) {
    if (confirm(`Deseja desfazer a última conclusão da tarefa "${taskName}"?`)) {
      removeLastTaskLog(taskName);
    }
  }
  
  // Formatar tempo do Pomodoro
  function formatPomodoroTime(time: number): string {
    const minutes = Math.floor(time);
    const seconds = Math.floor((time - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
</script>

<main class="container mx-auto p-4 max-w-6xl">
  <header class="mb-6">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-3xl font-bold text-primary-700 dark:text-primary-300">FocusTrack</h1>
      <div class="flex items-center space-x-4">
        <LanguageSelector />
        <ThemeToggle />
      </div>
    </div>
    
    <!-- Data e hora atual -->
    <div class="bg-surface-100 p-3 rounded-lg shadow mb-4">
      <h2 class="text-xl font-semibold">
        {now.toLocaleDateString('pt-BR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </h2>
      <p class="text-lg">
        {now.toLocaleTimeString('pt-BR')}
      </p>
    </div>
  </header>
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Coluna 1: Tarefa Atual e Pomodoro -->
    <div class="md:col-span-2">
      <!-- Tarefa Atual -->
      {#if currentTaskItem}
        <div class="bg-primary-100 dark:bg-primary-900 p-4 rounded-lg shadow-lg mb-6">
          <h2 class="text-2xl font-bold mb-2">Tarefa Atual</h2>
          <div class="flex justify-between items-start">
            <div>
              <p class="text-xl font-semibold">{currentTaskItem.task}</p>
              <p class="text-gray-600 dark:text-gray-300">
                {currentTaskItem.start} - {currentTaskItem.end}
              </p>
            </div>
            <div class="space-y-2">
              <button 
                class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition block w-full"
                on:click={() => completeTask(currentTaskItem as Task)}
              >
                Concluído
              </button>
              <button 
                class="{$isRunning && $pomodoroTask === currentTaskItem.task ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded-md transition block w-full"
                on:click={() => togglePomodoro(currentTaskItem?.task || '')}
              >
                {$isRunning && $pomodoroTask === currentTaskItem.task ? 'Parar' : 'Pomodoro'}
              </button>
            </div>
          </div>
          
          <!-- Pomodoro Timer (quando ativo) -->
          {#if $isRunning && $pomodoroTask === currentTaskItem.task}
            <div class="mt-4 p-3 bg-surface-200 dark:bg-surface-700 rounded-lg">
              <h3 class="text-lg font-semibold">Pomodoro Timer</h3>
              <p class="text-3xl font-mono text-center">{formatPomodoroTime($pomodoroTime)}</p>
            </div>
          {/if}
        </div>
      {:else}
        <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-lg mb-6">
          <h2 class="text-2xl font-bold mb-2">Sem Tarefa Atual</h2>
          <p>Não há nenhuma tarefa programada para o horário atual.</p>
        </div>
      {/if}
      
      <!-- Tarefas de Hoje -->
      <div class="bg-surface-100 p-4 rounded-lg shadow-lg mb-6">
        <h2 class="text-2xl font-bold mb-4">Tarefas de Hoje - {formatWeekday(currentDay)}</h2>
        <div class="space-y-3">
          {#each todayTasks as task}
            <div class="p-3 bg-white dark:bg-surface-800 rounded-md shadow">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-semibold">{task.task}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{task.start} - {task.end}</p>
                </div>
                <div class="space-x-2">
                  <button 
                    class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-sm rounded"
                    on:click={() => completeTask(task)}
                  >
                    Concluir
                  </button>
                  <button 
                    class="{$isRunning && $pomodoroTask === task.task ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white px-3 py-1 text-sm rounded"
                    on:click={() => togglePomodoro(task.task)}
                  >
                    {$isRunning && $pomodoroTask === task.task ? 'Parar' : 'Pomodoro'}
                  </button>
                </div>
              </div>
              
              <!-- Pomodoro Timer (quando ativo para esta tarefa) -->
              {#if $isRunning && $pomodoroTask === task.task}
                <div class="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  <p class="text-center font-mono">{formatPomodoroTime($pomodoroTime)}</p>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
    
    <!-- Coluna 2: Tarefas de Amanhã e Logs -->
    <div>
      <!-- Tarefas de Amanhã -->
      <div class="bg-surface-100 p-4 rounded-lg shadow-lg mb-6">
        <h2 class="text-xl font-bold mb-4">Tarefas de Amanhã - {formatWeekday(tomorrowDay)}</h2>
        <div class="space-y-2">
          {#each tomorrowTasks as task}
            <div class="p-2 bg-white dark:bg-surface-800 rounded-md shadow">
              <p class="font-semibold">{task.task}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">{task.start} - {task.end}</p>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Logs de Tarefas -->
      <div class="bg-surface-100 p-4 rounded-lg shadow-lg">
        <h2 class="text-xl font-bold mb-4">Histórico de Tarefas</h2>
        {#if Object.keys($taskLogsStore).length === 0}
          <p class="text-gray-600 dark:text-gray-400">Nenhuma tarefa concluída ainda.</p>
        {:else}
          <div class="space-y-4 max-h-96 overflow-y-auto">
            {#each Object.entries($taskLogsStore) as [taskName, logs]}
              <div class="p-3 bg-white dark:bg-surface-800 rounded-md shadow">
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-semibold">{taskName}</h3>
                    <p class="text-sm">Conclusões: {logs.count} | Total: {logs.totalHours.toFixed(1)}h</p>
                  </div>
                  <button 
                    class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xs rounded"
                    on:click={() => undoTaskCompletion(taskName)}
                    title="Desfazer última conclusão"
                  >
                    Desfazer
                  </button>
                </div>
                
                <!-- Detalhes expandíveis -->
                <details class="mt-2">
                  <summary class="cursor-pointer text-sm text-primary-700 dark:text-primary-300">
                    Ver detalhes
                  </summary>
                  <ul class="mt-2 pl-5 text-sm space-y-1">
                    {#each logs.entries.slice(0, 5) as entry}
                      <li>
                        {new Date(entry.timestamp).toLocaleDateString('pt-BR')} - 
                        {entry.duration.toFixed(1)}h
                      </li>
                    {/each}
                    {#if logs.entries.length > 5}
                      <li class="text-gray-500">+ {logs.entries.length - 5} mais entradas</li>
                    {/if}
                  </ul>
                </details>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
  
  <footer class="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
    <p class="text-sm text-gray-600 dark:text-gray-400">
      FocusTrack © 2025 - Gerencie seu tempo com eficiência
    </p>
  </footer>
</main>
