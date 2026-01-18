import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Task } from '../../services/task';
import { ProjectService } from '../../services/project';
import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './task-card.html',
  styleUrl: './task-card.css'
})
export class TaskCardComponent {
  @Input() task!: Task;
  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<string>();
  @Output() move = new EventEmitter<{ id: string; status: Task['status'] }>();

  private projectService = inject(ProjectService);

  getProjectName(projectId: string | undefined) {
    if (!projectId) return null;
    return this.projectService.projects$.pipe(
      map(projects => projects.find(p => p.id === projectId)?.name)
    );
  }

  isOverdue(): boolean {
    if (!this.task.dueDate || this.task.status === 'completed') return false;
    return new Date(this.task.dueDate) < new Date();
  }

  isDueSoon(): boolean {
    if (!this.task.dueDate || this.task.status === 'completed') return false;
    const due = new Date(this.task.dueDate);
    const today = new Date();
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  onEdit(): void {
    this.edit.emit(this.task);
  }

  onDelete(): void {
    this.delete.emit(this.task.id);
  }

  moveLeft(): void {
    const statusOrder: Task['status'][] = ['pending', 'ongoing', 'completed'];
    const currentIndex = statusOrder.indexOf(this.task.status);
    if (currentIndex > 0) {
      this.move.emit({ id: this.task.id, status: statusOrder[currentIndex - 1] });
    }
  }

  moveRight(): void {
    const statusOrder: Task['status'][] = ['pending', 'ongoing', 'completed'];
    const currentIndex = statusOrder.indexOf(this.task.status);
    if (currentIndex < statusOrder.length - 1) {
      this.move.emit({ id: this.task.id, status: statusOrder[currentIndex + 1] });
    }
  }
}