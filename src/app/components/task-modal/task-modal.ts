import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { Task } from '../../services/task';
import { ProjectService } from '../../services/project';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [FormsModule, AsyncPipe],
  templateUrl: './task-modal.html',
  styleUrl: './task-modal.css'
})
export class TaskModalComponent {
  @ViewChild('dialog') dialog!: ElementRef<HTMLDialogElement>;
  @Output() save = new EventEmitter<{ 
    title: string; 
    description: string; 
    projectId?: string; 
    priority: Task['priority'];
    dueDate?: string;
    id?: string 
  }>();

  private projectService = inject(ProjectService);
  projects$ = this.projectService.projects$;

  title = '';
  description = '';
  projectId = '';
  priority: Task['priority'] = 'medium';
  dueDate = '';
  editingId?: string;
  isEditing = false;

  open(task?: Task): void {
    if (task) {
      this.title = task.title;
      this.description = task.description;
      this.projectId = task.projectId || '';
      this.priority = task.priority || 'medium';
      this.dueDate = task.dueDate || '';
      this.editingId = task.id;
      this.isEditing = true;
    } else {
      this.title = '';
      this.description = '';
      this.projectId = '';
      this.priority = 'medium';
      this.dueDate = '';
      this.editingId = undefined;
      this.isEditing = false;
    }
    this.dialog.nativeElement.showModal();
  }

  close(): void {
    this.dialog.nativeElement.close();
  }

  onSubmit(): void {
    if (this.title.trim()) {
      this.save.emit({
        title: this.title.trim(),
        description: this.description.trim(),
        projectId: this.projectId || undefined,
        priority: this.priority,
        dueDate: this.dueDate || undefined,
        id: this.editingId
      });
      this.close();
    }
  }
}