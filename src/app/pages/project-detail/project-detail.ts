import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project';
import { TaskService, Task } from '../../services/task';
import { combineLatest, map, switchMap } from 'rxjs';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css'
})
export class ProjectDetail {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);

  projectData$ = this.route.paramMap.pipe(
    switchMap(params => {
      const projectId = params.get('id')!;
      return combineLatest([
        this.projectService.projects$,
        this.taskService.tasks$
      ]).pipe(
        map(([projects, tasks]) => {
          const project = projects.find(p => p.id === projectId);
          const projectTasks = tasks.filter(t => t.projectId === projectId);
          return {
            project,
            tasks: {
              pending: projectTasks.filter(t => t.status === 'pending'),
              ongoing: projectTasks.filter(t => t.status === 'ongoing'),
              completed: projectTasks.filter(t => t.status === 'completed')
            },
            stats: {
              total: projectTasks.length,
              completed: projectTasks.filter(t => t.status === 'completed').length
            }
          };
        })
      );
    })
  );
}