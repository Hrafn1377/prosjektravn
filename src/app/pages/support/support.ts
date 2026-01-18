import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { AsyncPipe } from '@angular/common';

interface Ticket {
  id: string;
  type: 'support' | 'bug' | 'feature';
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

interface FaqItem {
  question: string;
  answer: string;
  expanded: boolean;
}

interface TicketTemplate {
  type: 'support' | 'bug' | 'feature';
  name: string;
  icon: string;
  template: string;
}

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [FormsModule, AsyncPipe],
  templateUrl: './support.html',
  styleUrl: './support.css'
})
export class Support {
  private tickets = new BehaviorSubject<Ticket[]>(this.loadTickets());
  tickets$ = this.tickets.asObservable();

  showModal = false;
  showTemplateSelector = false;
  ticketType: Ticket['type'] = 'support';
  ticketSubject = '';
  ticketDescription = '';
  ticketPriority: Ticket['priority'] = 'medium';

  ticketTemplates: TicketTemplate[] = [
    {
      type: 'support',
      name: 'General Support',
      icon: '🎫',
      template: ''
    },
    {
      type: 'bug',
      name: 'Bug Report',
      icon: '🐛',
      template: `## Bug Report

### Description
[Briefly describe the bug]

### Steps to Reproduce
1. 
2. 
3. 

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Environment
- Browser: 
- OS: 
- Version: 

### Screenshots
[If applicable, describe or attach screenshots]

### Additional Context
[Any other relevant information]
`
    },
    {
      type: 'feature',
      name: 'Feature Request',
      icon: '💡',
      template: `## Feature Request

### Summary
[One-line description of the feature]

### Problem Statement
[What problem does this solve?]

### Proposed Solution
[How should this feature work?]

### User Story
As a [type of user], I want [goal] so that [benefit].

### Acceptance Criteria
- [ ] 
- [ ] 
- [ ] 

### Priority
[ ] Nice to have
[ ] Should have
[ ] Must have

### Additional Context
[Mockups, examples, or related features]
`
    }
  ];

  faqs: FaqItem[] = [
    { question: 'How do I create a new task?', answer: 'Navigate to the Tasks page and click the "+ New Task" button. Fill in the title, description, and optionally set a priority, due date, and project.', expanded: false },
    { question: 'How do I assign tasks to projects?', answer: 'When creating or editing a task, use the Project dropdown to select which project the task belongs to.', expanded: false },
    { question: 'Can I move tasks between columns?', answer: 'Yes! You can drag and drop tasks between columns, or use the arrow buttons on each task card to move them.', expanded: false },
    { question: 'How do I invite team members?', answer: 'Go to the Collaborations page and click "+ Add Member" to add team members to your workspace.', expanded: false },
    { question: 'Is my data secure?', answer: 'Currently, ProsjektRavn stores data locally in your browser. For enterprise features with cloud storage and enhanced security, contact our support team.', expanded: false },
  ];

  private loadTickets(): Ticket[] {
    const saved = localStorage.getItem('prosjektravn-tickets');
    return saved ? JSON.parse(saved) : [];
  }

  private saveTickets(tickets: Ticket[]): void {
    localStorage.setItem('prosjektravn-tickets', JSON.stringify(tickets));
    this.tickets.next(tickets);
  }

  openTemplateSelector(): void {
    this.showTemplateSelector = true;
  }

  closeTemplateSelector(): void {
    this.showTemplateSelector = false;
  }

  selectTemplate(template: TicketTemplate): void {
    this.ticketType = template.type;
    this.ticketSubject = '';
    this.ticketDescription = template.template;
    this.ticketPriority = template.type === 'bug' ? 'high' : 'medium';
    this.showTemplateSelector = false;
    this.showModal = true;
  }

  openModal(): void {
    this.ticketType = 'support';
    this.ticketSubject = '';
    this.ticketDescription = '';
    this.ticketPriority = 'medium';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  submitTicket(): void {
    if (this.ticketSubject.trim() && this.ticketDescription.trim()) {
      const tickets = this.tickets.value;
      const newTicket: Ticket = {
        id: crypto.randomUUID(),
        type: this.ticketType,
        subject: this.ticketSubject.trim(),
        description: this.ticketDescription.trim(),
        status: 'open',
        priority: this.ticketPriority,
        createdAt: new Date()
      };
      this.saveTickets([newTicket, ...tickets]);
      this.closeModal();
    }
  }

  updateTicketStatus(id: string, status: Ticket['status']): void {
    const tickets = this.tickets.value.map(t =>
      t.id === id ? { ...t, status } : t
    );
    this.saveTickets(tickets);
  }

  deleteTicket(id: string): void {
    const tickets = this.tickets.value.filter(t => t.id !== id);
    this.saveTickets(tickets);
  }

  toggleFaq(faq: FaqItem): void {
    faq.expanded = !faq.expanded;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'bug': return '🐛';
      case 'feature': return '💡';
      default: return '🎫';
    }
  }

  getTypeName(type: string): string {
    switch (type) {
      case 'bug': return 'Bug Report';
      case 'feature': return 'Feature Request';
      default: return 'Support';
    }
  }
}