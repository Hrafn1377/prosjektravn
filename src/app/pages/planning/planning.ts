import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, Task } from '../../services/task';
import { ProjectService, Project } from '../../services/project';
import { combineLatest, Subscription } from 'rxjs';

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  taskCount: number;
}

interface CalendarWeek {
  weekNumber: number;
  days: CalendarDay[];
}

interface ProjectSwimlane {
  project: Project;
  tasks: Task[];
}

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planning.html',
  styleUrl: './planning.css'
})
export class Planning implements OnInit, OnDestroy {
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private subscription?: Subscription;

  currentDate = new Date();
  calendarWeeks: CalendarWeek[] = [];
  swimlanes: ProjectSwimlane[] = [];
  unassignedTasks: Task[] = [];
  
  maxTasksPerDay = 1;

  ngOnInit(): void {
    this.subscription = combineLatest([
      this.taskService.tasks$,
      this.projectService.projects$
    ]).subscribe(([tasks, projects]) => {
      this.buildCalendar();
      this.buildSwimlanes(tasks, projects);
      this.calculateHeatMap(tasks);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private buildCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    const dayOfWeek = startDate.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);
    
    this.calendarWeeks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentWeekStart = new Date(startDate);
    
    for (let w = 0; w < 6; w++) {
      const week: CalendarWeek = {
        weekNumber: this.getWeekNumber(currentWeekStart),
        days: []
      };
      
      for (let d = 0; d < 7; d++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + d);
        
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);
        
        week.days.push({
          date: dateOnly,
          dayOfMonth: date.getDate(),
          isCurrentMonth: date.getMonth() === month,
          isToday: dateOnly.getTime() === today.getTime(),
          taskCount: 0
        });
      }
      
      this.calendarWeeks.push(week);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      
      if (currentWeekStart.getMonth() !== month && currentWeekStart > lastDay) {
        break;
      }
    }
  }

  private buildSwimlanes(tasks: Task[], projects: Project[]): void {
    this.swimlanes = projects.map(project => ({
      project,
      tasks: tasks.filter(t => t.projectId === project.id && t.dueDate)
    })).filter(s => s.tasks.length > 0);
    
    this.unassignedTasks = tasks.filter(t => !t.projectId && t.dueDate);
  }

  private calculateHeatMap(tasks: Task[]): void {
    const taskCounts = new Map<string, number>();
    
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = task.dueDate.split('T')[0];
        taskCounts.set(dateKey, (taskCounts.get(dateKey) || 0) + 1);
      }
    });
    
    this.maxTasksPerDay = Math.max(1, ...taskCounts.values());
    
    this.calendarWeeks.forEach(week => {
      week.days.forEach(day => {
        const dateKey = this.formatDate(day.date);
        day.taskCount = taskCounts.get(dateKey) || 0;
      });
    });
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getHeatClass(taskCount: number): string {
    if (taskCount === 0) return '';
    if (taskCount === 1) return 'heat-light';
    if (taskCount === 2) return 'heat-medium';
    return 'heat-heavy';
  }

  getTaskPosition(task: Task, week: CalendarWeek): { start: number; span: number } | null {
    if (!task.dueDate) return null;
    
    const taskStart = task.createdAt ? new Date(task.createdAt) : new Date(task.dueDate);
    const taskEnd = new Date(task.dueDate);
    
    taskStart.setHours(0, 0, 0, 0);
    taskEnd.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(week.days[0].date);
    const weekEnd = new Date(week.days[6].date);
    
    weekStart.setHours(0, 0, 0, 0);
    weekEnd.setHours(23, 59, 59, 999);
    
    if (taskEnd < weekStart || taskStart > weekEnd) {
      return null;
    }
    
    let startIndex = 0;
    if (taskStart >= weekStart) {
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(week.days[i].date);
        dayDate.setHours(0, 0, 0, 0);
        if (dayDate.getTime() >= taskStart.getTime()) {
          startIndex = i;
          break;
        }
      }
    }
    
    let endIndex = 6;
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(week.days[i].date);
      dayDate.setHours(0, 0, 0, 0);
      if (dayDate.getTime() >= taskEnd.getTime()) {
        endIndex = i;
        break;
      }
    }
    
    return {
      start: startIndex,
      span: Math.max(1, endIndex - startIndex + 1)
    };
  }

  previousMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1
    );
    this.buildCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1
    );
    this.buildCalendar();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.buildCalendar();
  }

  getMonthName(): string {
    return this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getProgressWidth(task: Task): number {
    if (task.status === 'completed') return 100;
    if (task.status === 'ongoing') return 50;
    return 0;
  }

  getTaskColor(task: Task, project?: Project): string {
    if (project?.color) return project.color;
    
    switch (task.priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6366f1';
    }
  }
}