import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { SocketService } from './socket';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'ongoing' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  projectId?: string;
  assigned_to?: string;
  createdAt: Date;
}


interface DbTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'ongoing' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  project_id?: string;
  created_at: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private socketService = inject(SocketService);
  private tasks = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasks.asObservable();

  constructor() {
    this.loadTasks();
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    this.socketService.taskCreated$.subscribe(task => {
      const exists = this.tasks.value.some(t => t.id === task.id);
      if (!exists) {
        this.tasks.next([this.mapFromDb(task), ...this.tasks.value]);
      }
    });

    this.socketService.taskUpdated$.subscribe(task => {
      const tasks = this.tasks.value.map(t => 
        t.id === task.id ? this.mapFromDb(task) : t
      );
      this.tasks.next(tasks);
    });

    this.socketService.taskDeleted$.subscribe(({ id }) => {
      const tasks = this.tasks.value.filter(t => t.id !== id);
      this.tasks.next(tasks);
    });
  }

  private mapFromDb(task: DbTask): Task {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      projectId: task.project_id,
      createdAt: task.created_at
    };
  }

  private loadTasks(): void {
    this.http.get<DbTask[]>(`${environment.apiUrl}/tasks`).subscribe(tasks => {
      this.tasks.next(tasks.map(t => this.mapFromDb(t)));
    });
  }

  addTask(title: string, description: string, projectId?: string, priority: Task['priority'] = 'medium', dueDate?: string): void {
    this.http.post<DbTask>(`${environment.apiUrl}/tasks`, {
      title,
      description,
      project_id: projectId,
      priority,
      due_date: dueDate
    }).subscribe();
  }

  updateTask(id: string, updates: Partial<Task>): void {
    const task = this.tasks.value.find(t => t.id === id);
    if (!task) return;

    this.http.put<DbTask>(`${environment.apiUrl}/tasks/${id}`, {
      title: updates.title ?? task.title,
      description: updates.description ?? task.description,
      status: updates.status ?? task.status,
      priority: updates.priority ?? task.priority,
      project_id: updates.projectId ?? task.projectId,
      due_date: updates.dueDate ?? task.dueDate
    }).subscribe();
  }

  deleteTask(id: string): void {
    this.http.delete(`${environment.apiUrl}/tasks/${id}`).subscribe();
  }

  moveTask(id: string, status: Task['status']): void {
    this.updateTask(id, { status });
  }

  getTasksByProject(projectId: string): Task[] {
    return this.tasks.value.filter(task => task.projectId === projectId);
  }
}