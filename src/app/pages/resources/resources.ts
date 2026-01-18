import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { TaskService } from '../../services/task';
import { environment } from '../../../environments/environment';

interface Resource {
  id: string;
  name: string;
  role: string;
  capacity: number;
}

interface ResourceWithStats extends Resource {
  taskCount: number;
  workload: number;
  utilizationRate: number;
}

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [AsyncPipe, FormsModule],
  templateUrl: './resources.html',
  styleUrl: './resources.css'
})
export class Resources implements OnInit {
  private http = inject(HttpClient);
  private taskService = inject(TaskService);
  private resources = new BehaviorSubject<Resource[]>([]);
  
  Math = Math;

  resourceData$ = combineLatest([
    this.resources.asObservable(),
    this.taskService.tasks$
  ]).pipe(
    map(([resources, tasks]) => 
      resources.map(r => {
        const assignedTasks = tasks.filter(t => t.assigned_to === r.name && t.status !== 'completed');
        const workload = assignedTasks.length * 8;
        return {
          ...r,
          taskCount: assignedTasks.length,
          workload,
          utilizationRate: r.capacity > 0 ? Math.round((workload / r.capacity) * 100) : 0
        } as ResourceWithStats;
      })
    )
  );

  showModal = false;
  editingResource: Resource | null = null;
  resourceName = '';
  resourceRole = '';
  resourceCapacity = 40;

  ngOnInit(): void {
    this.loadResources();
  }

  private loadResources(): void {
    this.http.get<Resource[]>(`${environment.apiUrl}/resources`).subscribe(resources => {
      this.resources.next(resources);
    });
  }

  openModal(resource?: Resource): void {
    if (resource) {
      this.editingResource = resource;
      this.resourceName = resource.name;
      this.resourceRole = resource.role;
      this.resourceCapacity = resource.capacity;
    } else {
      this.editingResource = null;
      this.resourceName = '';
      this.resourceRole = '';
      this.resourceCapacity = 40;
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingResource = null;
  }

  saveResource(): void {
    if (this.resourceName.trim() && this.resourceRole.trim()) {
      const data = {
        name: this.resourceName.trim(),
        role: this.resourceRole.trim(),
        capacity: this.resourceCapacity
      };

      if (this.editingResource) {
        this.http.put<Resource>(`${environment.apiUrl}/resources/${this.editingResource.id}`, data)
          .subscribe(updated => {
            const resources = this.resources.value.map(r => r.id === updated.id ? updated : r);
            this.resources.next(resources);
            this.closeModal();
          });
      } else {
        this.http.post<Resource>(`${environment.apiUrl}/resources`, data)
          .subscribe(created => {
            this.resources.next([created, ...this.resources.value]);
            this.closeModal();
          });
      }
    }
  }

  deleteResource(id: string): void {
    this.http.delete(`${environment.apiUrl}/resources/${id}`).subscribe(() => {
      const resources = this.resources.value.filter(r => r.id !== id);
      this.resources.next(resources);
    });
  }

  getUtilizationColor(rate: number): string {
    if (rate < 70) return '#10b981';
    if (rate < 90) return '#f59e0b';
    return '#ef4444';
  }
}