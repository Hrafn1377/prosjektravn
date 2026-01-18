import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { SocketService } from './socket';

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: Date;
}

interface DbProject {
  id: string;
  name: string;
  description: string;
  color: string;
  created_at: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private http = inject(HttpClient);
  private socketService = inject(SocketService);
  private projects = new BehaviorSubject<Project[]>([]);
  projects$ = this.projects.asObservable();

  private colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  constructor() {
    this.loadProjects();
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    this.socketService.projectCreated$.subscribe(project => {
      const exists = this.projects.value.some(p => p.id === project.id);
      if (!exists) {
        this.projects.next([this.mapFromDb(project), ...this.projects.value]);
      }
    });

    this.socketService.projectUpdated$.subscribe(project => {
      const projects = this.projects.value.map(p => 
        p.id === project.id ? this.mapFromDb(project) : p
      );
      this.projects.next(projects);
    });

    this.socketService.projectDeleted$.subscribe(({ id }) => {
      const projects = this.projects.value.filter(p => p.id !== id);
      this.projects.next(projects);
    });
  }

  private mapFromDb(project: DbProject): Project {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      createdAt: project.created_at
    };
  }

  private loadProjects(): void {
    this.http.get<DbProject[]>(`${environment.apiUrl}/projects`).subscribe(projects => {
      this.projects.next(projects.map(p => this.mapFromDb(p)));
    });
  }

  addProject(name: string, description: string): void {
    const color = this.colors[this.projects.value.length % this.colors.length];
    this.http.post<DbProject>(`${environment.apiUrl}/projects`, {
      name,
      description,
      color
    }).subscribe();
  }

  updateProject(id: string, updates: Partial<Project>): void {
    const project = this.projects.value.find(p => p.id === id);
    if (!project) return;

    this.http.put<DbProject>(`${environment.apiUrl}/projects/${id}`, {
      name: updates.name ?? project.name,
      description: updates.description ?? project.description,
      color: updates.color ?? project.color
    }).subscribe();
  }

  deleteProject(id: string): void {
    this.http.delete(`${environment.apiUrl}/projects/${id}`).subscribe();
  }

  getProject(id: string): Project | undefined {
    return this.projects.value.find(p => p.id === id);
  }
}