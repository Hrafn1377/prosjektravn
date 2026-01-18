import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

interface SharedFile {
  id: string;
  name: string;
  type: string;
  size: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
}

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [AsyncPipe, FormsModule],
  templateUrl: './files.html',
  styleUrl: './files.css'
})
export class Files implements OnInit {
  private http = inject(HttpClient);
  private files = new BehaviorSubject<SharedFile[]>([]);
  files$ = this.files.asObservable();

  ngOnInit(): void {
    this.loadFiles();
  }

  private loadFiles(): void {
    this.http.get<SharedFile[]>(`${environment.apiUrl}/files`).subscribe(files => {
      this.files.next(files);
    });
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const newFile = {
        name: file.name,
        type: file.type.split('/')[1]?.toUpperCase() || 'FILE',
        size: this.formatSize(file.size)
      };
      
      this.http.post<SharedFile>(`${environment.apiUrl}/files`, newFile).subscribe(created => {
        this.files.next([created, ...this.files.value]);
      });
      
      input.value = '';
    }
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  approve(id: string): void {
    this.http.put<SharedFile>(`${environment.apiUrl}/files/${id}/status`, { status: 'approved' })
      .subscribe(updated => {
        const files = this.files.value.map(f => f.id === id ? updated : f);
        this.files.next(files);
      });
  }

  reject(id: string): void {
    this.http.put<SharedFile>(`${environment.apiUrl}/files/${id}/status`, { status: 'rejected' })
      .subscribe(updated => {
        const files = this.files.value.map(f => f.id === id ? updated : f);
        this.files.next(files);
      });
  }

  deleteFile(id: string): void {
    this.http.delete(`${environment.apiUrl}/files/${id}`).subscribe(() => {
      const files = this.files.value.filter(f => f.id !== id);
      this.files.next(files);
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
}