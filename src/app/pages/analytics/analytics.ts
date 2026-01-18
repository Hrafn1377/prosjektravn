import { Component, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { TaskService, Task } from '../../services/task';
import { ProjectService } from '../../services/project';
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [AsyncPipe, DatePipe],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css'
})
export class Analytics {
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);

  showReport = false;
  reportCopied = false;

  analytics$ = combineLatest([
    this.taskService.tasks$,
    this.projectService.projects$
  ]).pipe(
    map(([tasks, projects]) => {
      const completedTasks = tasks.filter(t => t.status === 'completed');
      const ongoingTasks = tasks.filter(t => t.status === 'ongoing');
      const pendingTasks = tasks.filter(t => t.status === 'pending');
      const totalTasks = tasks.length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

      const priorityBreakdown = {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
      };

      const statusBreakdown = {
        pending: pendingTasks.length,
        ongoing: ongoingTasks.length,
        completed: completedTasks.length
      };

      const projectStats = projects.map(p => {
        const projectTasks = tasks.filter(t => t.projectId === p.id);
        const completed = projectTasks.filter(t => t.status === 'completed').length;
        return {
          name: p.name,
          color: p.color,
          total: projectTasks.length,
          completed,
          rate: projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0
        };
      });

      const now = new Date();
      const overdueTasks = tasks.filter(t => {
        if (!t.dueDate || t.status === 'completed') return false;
        return new Date(t.dueDate) < now;
      });

      // Recently completed (last 7 days)
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentlyCompleted = completedTasks.filter(t => {
        if (!t.createdAt) return false;
        return new Date(t.createdAt) >= weekAgo;
      });

      // High priority in progress
      const highPriorityOngoing = ongoingTasks.filter(t => t.priority === 'high');

      return {
        totalTasks,
        completedTasks: completedTasks.length,
        completionRate,
        priorityBreakdown,
        statusBreakdown,
        projectStats,
        overdueTasks: overdueTasks.length,
        totalProjects: projects.length,
        // For status report
        recentlyCompletedList: recentlyCompleted,
        ongoingList: ongoingTasks,
        overdueList: overdueTasks,
        highPriorityOngoing,
        pendingList: pendingTasks,
        projects
      };
    })
  );

  toggleReport(): void {
    this.showReport = !this.showReport;
    this.reportCopied = false;
  }

  copyReport(data: any): void {
    const report = this.generateReportText(data);
    navigator.clipboard.writeText(report).then(() => {
      this.reportCopied = true;
      setTimeout(() => this.reportCopied = false, 2000);
    });
  }

  generateReportText(data: any): string {
    const date = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    let report = `STATUS REPORT - ${date}\n`;
    report += `${'='.repeat(50)}\n\n`;

    report += `SUMMARY\n`;
    report += `-`.repeat(30) + `\n`;
    report += `Total Tasks: ${data.totalTasks}\n`;
    report += `Completed: ${data.completedTasks} (${data.completionRate}%)\n`;
    report += `In Progress: ${data.statusBreakdown.ongoing}\n`;
    report += `Pending: ${data.statusBreakdown.pending}\n`;
    report += `Overdue: ${data.overdueTasks}\n\n`;

    report += `COMPLETED\n`;
    report += `-`.repeat(30) + `\n`;
    if (data.recentlyCompletedList.length > 0) {
      data.recentlyCompletedList.forEach((t: Task) => {
        report += `✓ ${t.title}\n`;
      });
    } else {
      report += `No tasks completed recently.\n`;
    }
    report += `\n`;

    report += `IN PROGRESS\n`;
    report += `-`.repeat(30) + `\n`;
    if (data.ongoingList.length > 0) {
      data.ongoingList.forEach((t: Task) => {
        const priority = t.priority === 'high' ? '[HIGH] ' : '';
        report += `→ ${priority}${t.title}\n`;
      });
    } else {
      report += `No tasks in progress.\n`;
    }
    report += `\n`;

    report += `ISSUES & BLOCKERS\n`;
    report += `-`.repeat(30) + `\n`;
    if (data.overdueList.length > 0) {
      data.overdueList.forEach((t: Task) => {
        const dueDate = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '';
        report += `⚠ ${t.title} (Due: ${dueDate})\n`;
      });
    } else {
      report += `No overdue tasks.\n`;
    }
    report += `\n`;

    report += `PROJECT STATUS\n`;
    report += `-`.repeat(30) + `\n`;
    if (data.projectStats.length > 0) {
      data.projectStats.forEach((p: any) => {
        report += `${p.name}: ${p.completed}/${p.total} tasks (${p.rate}%)\n`;
      });
    } else {
      report += `No projects.\n`;
    }

    return report;
  }

  getProjectName(projectId: string | undefined, projects: any[]): string {
    if (!projectId) return 'Unassigned';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown';
  }
}