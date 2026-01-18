import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProjectService, Project } from '../../services/project';
import { TaskService } from '../../services/task';
import { map, combineLatest } from 'rxjs';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [AsyncPipe, FormsModule, RouterLink],
  templateUrl: './projects.html',
  styleUrl: './projects.css'
})
export class Projects {
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);

  showModal = false;
  editingProject: Project | null = null;
  projectName = '';
  projectDescription = '';

  projectsWithCounts$ = combineLatest([
    this.projectService.projects$,
    this.taskService.tasks$
  ]).pipe(
    map(([projects, tasks]) => 
      projects.map(project => ({
        ...project,
        taskCount: tasks.filter(t => t.projectId === project.id).length,
        completedCount: tasks.filter(t => t.projectId === project.id && t.status === 'completed').length
      }))
    )
  );

  openNewProject(): void {
    this.editingProject = null;
    this.projectName = '';
    this.projectDescription = '';
    this.showModal = true;
  }

  openEditProject(project: Project): void {
    this.editingProject = project;
    this.projectName = project.name;
    this.projectDescription = project.description;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveProject(): void {
    if (this.projectName.trim()) {
      if (this.editingProject) {
        this.projectService.updateProject(this.editingProject.id, {
          name: this.projectName.trim(),
          description: this.projectDescription.trim()
        });
      } else {
        this.projectService.addProject(
          this.projectName.trim(),
          this.projectDescription.trim()
        );
      }
      this.closeModal();
    }
  }

  deleteProject(id: string): void {
    this.projectService.deleteProject(id);
  }
}