import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private authService = inject(AuthService);

  // Event subjects
  projectCreated$ = new Subject<any>();
  projectUpdated$ = new Subject<any>();
  projectDeleted$ = new Subject<{ id: string }>();
  
  taskCreated$ = new Subject<any>();
  taskUpdated$ = new Subject<any>();
  taskDeleted$ = new Subject<{ id: string }>();

  constructor() {
    // Connect when user logs in
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  private connect(): void {
    const token = localStorage.getItem('prosjektravn-token');
    if (!token || this.socket?.connected) return;

    this.socket = io(environment.apiUrl.replace('/api', ''), {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
    });

    // Project events
    this.socket.on('project:created', (data) => this.projectCreated$.next(data));
    this.socket.on('project:updated', (data) => this.projectUpdated$.next(data));
    this.socket.on('project:deleted', (data) => this.projectDeleted$.next(data));

    // Task events
    this.socket.on('task:created', (data) => this.taskCreated$.next(data));
    this.socket.on('task:updated', (data) => this.taskUpdated$.next(data));
    this.socket.on('task:deleted', (data) => this.taskDeleted$.next(data));
  }

  private disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}