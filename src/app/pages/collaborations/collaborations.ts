import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import { environment } from '../../../environments/environment';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  created_at: Date;
  task_id?: string;
}

@Component({
  selector: 'app-collaborations',
  standalone: true,
  imports: [AsyncPipe, FormsModule],
  templateUrl: './collaborations.html',
  styleUrl: './collaborations.css'
})
export class Collaborations implements OnInit {
  private http = inject(HttpClient);
  private teamMembers = new BehaviorSubject<TeamMember[]>([]);
  private comments = new BehaviorSubject<Comment[]>([]);
  
  teamMembers$ = this.teamMembers.asObservable();
  comments$ = this.comments.asObservable();

  showMemberModal = false;
  editingMember: TeamMember | null = null;
  memberName = '';
  memberEmail = '';
  memberRole = '';
  memberAvatar = '👤';

  newComment = '';
  avatarOptions = ['👤', '👨', '👩', '🧑', '👨‍💻', '👩‍💻', '🧑‍💼', '👨‍💼', '👩‍💼'];

  ngOnInit(): void {
    this.loadTeamMembers();
    this.loadComments();
  }

  private loadTeamMembers(): void {
    this.http.get<TeamMember[]>(`${environment.apiUrl}/team`).subscribe(members => {
      this.teamMembers.next(members);
    });
  }

  private loadComments(): void {
    this.http.get<Comment[]>(`${environment.apiUrl}/comments`).subscribe(comments => {
      this.comments.next(comments);
    });
  }

  openMemberModal(member?: TeamMember): void {
    if (member) {
      this.editingMember = member;
      this.memberName = member.name;
      this.memberEmail = member.email;
      this.memberRole = member.role;
      this.memberAvatar = member.avatar;
    } else {
      this.editingMember = null;
      this.memberName = '';
      this.memberEmail = '';
      this.memberRole = '';
      this.memberAvatar = '👤';
    }
    this.showMemberModal = true;
  }

  closeMemberModal(): void {
    this.showMemberModal = false;
    this.editingMember = null;
  }

  saveMember(): void {
    if (this.memberName.trim() && this.memberEmail.trim()) {
      const data = {
        name: this.memberName.trim(),
        email: this.memberEmail.trim(),
        role: this.memberRole.trim(),
        avatar: this.memberAvatar
      };

      if (this.editingMember) {
        this.http.put<TeamMember>(`${environment.apiUrl}/team/${this.editingMember.id}`, data)
          .subscribe(updated => {
            const members = this.teamMembers.value.map(m => m.id === updated.id ? updated : m);
            this.teamMembers.next(members);
            this.closeMemberModal();
          });
      } else {
        this.http.post<TeamMember>(`${environment.apiUrl}/team`, data)
          .subscribe(created => {
            this.teamMembers.next([created, ...this.teamMembers.value]);
            this.closeMemberModal();
          });
      }
    }
  }

  deleteMember(id: string): void {
    this.http.delete(`${environment.apiUrl}/team/${id}`).subscribe(() => {
      const members = this.teamMembers.value.filter(m => m.id !== id);
      this.teamMembers.next(members);
    });
  }

  addComment(): void {
    if (this.newComment.trim()) {
      const data = {
        author: 'Current User',
        content: this.newComment.trim()
      };

      this.http.post<Comment>(`${environment.apiUrl}/comments`, data)
        .subscribe(created => {
          this.comments.next([created, ...this.comments.value]);
          this.newComment = '';
        });
    }
  }

  deleteComment(id: string): void {
    this.http.delete(`${environment.apiUrl}/comments/${id}`).subscribe(() => {
      const comments = this.comments.value.filter(c => c.id !== id);
      this.comments.next(comments);
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }
}