import { Component, ViewChild, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService, Task } from '../../services/task';
import { TaskCardComponent } from '../task-card/task-card';
import { TaskModalComponent } from '../task-modal/task-modal';


@Component ({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [AsyncPipe, DragDropModule, TaskCardComponent, TaskModalComponent],
  templateUrl: './kanban-board.html',
  styleUrl: './kanban-board.css'
})
export class KanbanBoardComponent {
  @ViewChild(TaskModalComponent) modal!: TaskModalComponent;

  private taskService = inject(TaskService);
  tasks$ = this.taskService.tasks$;
  
  pendingTasks: Task[] = [];
  ongoingTasks: Task[] = [];
  completedTasks: Task[] = [];

  constructor() {
    this.tasks$.subscribe(tasks => {
      this.pendingTasks = tasks.filter(t => t.status === 'pending');
      this.ongoingTasks = tasks.filter(t => t.status === 'ongoing');
      this.completedTasks = tasks.filter(t => t.status === 'completed');
    });
  }

  drop(event: CdkDragDrop<Task[]>, newStatus: Task['status']): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      this.taskService.moveTask(task.id, newStatus);
    }
  }

  openNewTask(): void {
    this.modal.open();
  }

  openEditTask(task: Task): void {
    this.modal.open(task);
  }

  onSave(data: { title: string; description: string; projectId?: string; priority: Task['priority']; dueDate?: string; id?: string }): void {
    if (data.id) {
      this.taskService.updateTask(data.id, {
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        priority: data.priority,
        dueDate: data.dueDate
      });
    } else {
      this.taskService.addTask(data.title, data.description, data.projectId, data.priority, data.dueDate);
    }
  }

  onDelete(id: string): void {
    this.taskService.deleteTask(id);
  }

  onMove(event: { id: string; status: Task['status'] }): void {
    this.taskService.moveTask(event.id, event.status);
  }
}