import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TaskService } from '../../services/task';
import { ProjectService } from '../../services/project';
import { map, combineLatest } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);

  dashboardData$ = combineLatest([
    this.taskService.tasks$,
    this.projectService.projects$
  ]).pipe(
    map(([tasks, projects]) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayTasks = tasks.filter(t => {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        due.setHours(0, 0, 0, 0);
        return due.getTime() === today.getTime();
      });

      const overdueTasks = tasks.filter(t => {
        if (!t.dueDate || t.status === 'completed') return false;
        return new Date(t.dueDate) < today;
      });

      const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed');

      return {
        stats: {
          total: tasks.length,
          pending: tasks.filter(t => t.status === 'pending').length,
          ongoing: tasks.filter(t => t.status === 'ongoing').length,
          completed: tasks.filter(t => t.status === 'completed').length,
          today: todayTasks.length,
          overdue: overdueTasks.length,
          highPriority: highPriorityTasks.length
        },
        recentTasks: tasks.slice(-5).reverse(),
        overdueTasks: overdueTasks.slice(0, 5),
        todayTasks: todayTasks.slice(0, 5),
        projects: projects.map(p => ({
          ...p,
          taskCount: tasks.filter(t => t.projectId === p.id).length,
          completedCount: tasks.filter(t => t.projectId === p.id && t.status === 'completed').length
        })).slice(0, 4)
      };
    })
  );
}