import { Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

interface Document {
  id: string;
  title: string;
  content: string;
  folder: string;
  created_at: Date;
  updated_at: Date;
}

interface DocTemplate {
  name: string;
  icon: string;
  title: string;
  content: string;
}

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [AsyncPipe, FormsModule],
  templateUrl: './documents.html',
  styleUrl: './documents.css'
})
export class Documents implements OnInit {
  private http = inject(HttpClient);
  private documents = new BehaviorSubject<Document[]>([]);
  documents$ = this.documents.asObservable();

  folders = ['General', 'Policies', 'Templates', 'Meeting Notes', 'Archive'];
  selectedFolder = 'General';
  editingDoc: Document | null = null;
  showEditor = false;
  showTemplates = false;
  docTitle = '';
  docContent = '';
  docFolder = 'General';

  templates: DocTemplate[] = [
    {
      name: 'Meeting Notes',
      icon: '📝',
      title: 'Meeting Notes - [Date]',
      content: `## Meeting Notes

**Date:** [Date]
**Attendees:** [Names]
**Location:** [Location/Virtual]

---

### Agenda
1. 
2. 
3. 

---

### Discussion Points


---

### Action Items
| Task | Owner | Due Date |
|------|-------|----------|
|      |       |          |

---

### Next Meeting
**Date:** 
**Topics:** 
`
    },
    {
      name: 'Project Brief',
      icon: '📋',
      title: 'Project Brief - [Project Name]',
      content: `## Project Brief

### Overview
**Project Name:** 
**Project Manager:** 
**Start Date:** 
**Target Completion:** 

---

### Objectives
- 
- 
- 

---

### Scope
**In Scope:**
- 

**Out of Scope:**
- 

---

### Stakeholders
| Name | Role | Responsibility |
|------|------|----------------|
|      |      |                |

---

### Success Criteria
1. 
2. 
3. 

---

### Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
|      |        |            |

---

### Budget
**Estimated:** 
**Approved:** 
`
    },
    {
      name: 'Status Update',
      icon: '📊',
      title: 'Status Update - [Date]',
      content: `## Status Update

**Report Date:** [Date]
**Reporting Period:** [Start] - [End]
**Author:** 

---

### Summary
[Brief overview of current status]

---

### Accomplishments
- ✅ 
- ✅ 
- ✅ 

---

### In Progress
- 🔄 
- 🔄 

---

### Upcoming
- 📅 
- 📅 

---

### Issues & Blockers
| Issue | Impact | Status | Owner |
|-------|--------|--------|-------|
|       |        |        |       |

---

### Metrics
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
|        |        |        |        |

---

### Notes
`
    },
    {
      name: 'Requirements Doc',
      icon: '📑',
      title: 'Requirements - [Feature Name]',
      content: `## Requirements Document

### Document Info
**Feature:** 
**Author:** 
**Version:** 1.0
**Last Updated:** [Date]

---

### Overview
[Brief description of the feature/requirement]

---

### Business Requirements
1. 
2. 
3. 

---

### Functional Requirements

#### FR-001: [Requirement Title]
**Description:** 
**Priority:** High / Medium / Low
**Acceptance Criteria:**
- [ ] 
- [ ] 

#### FR-002: [Requirement Title]
**Description:** 
**Priority:** High / Medium / Low
**Acceptance Criteria:**
- [ ] 
- [ ] 

---

### Non-Functional Requirements
- **Performance:** 
- **Security:** 
- **Scalability:** 
- **Accessibility:** 

---

### Dependencies
- 

---

### Assumptions
- 

---

### Open Questions
1. 
2. 
`
    }
  ];

  ngOnInit(): void {
    this.loadDocuments();
  }

  private loadDocuments(): void {
    this.http.get<Document[]>(`${environment.apiUrl}/documents`).subscribe(docs => {
      this.documents.next(docs);
    });
  }

  getDocsByFolder(docs: Document[], folder: string): Document[] {
    return docs.filter(d => d.folder === folder);
  }

  newDocument(): void {
    this.editingDoc = null;
    this.docTitle = '';
    this.docContent = '';
    this.docFolder = this.selectedFolder;
    this.showEditor = true;
    this.showTemplates = false;
  }

  openTemplates(): void {
    this.showTemplates = true;
  }

  closeTemplates(): void {
    this.showTemplates = false;
  }

  useTemplate(template: DocTemplate): void {
    this.editingDoc = null;
    this.docTitle = template.title;
    this.docContent = template.content;
    this.docFolder = this.selectedFolder;
    this.showTemplates = false;
    this.showEditor = true;
  }

  editDocument(doc: Document): void {
    this.editingDoc = doc;
    this.docTitle = doc.title;
    this.docContent = doc.content;
    this.docFolder = doc.folder;
    this.showEditor = true;
  }

  saveDocument(): void {
    if (this.docTitle.trim()) {
      if (this.editingDoc) {
        this.http.put<Document>(`${environment.apiUrl}/documents/${this.editingDoc.id}`, {
          title: this.docTitle.trim(),
          content: this.docContent,
          folder: this.docFolder
        }).subscribe(updated => {
          const docs = this.documents.value.map(d => d.id === updated.id ? updated : d);
          this.documents.next(docs);
          this.closeEditor();
        });
      } else {
        this.http.post<Document>(`${environment.apiUrl}/documents`, {
          title: this.docTitle.trim(),
          content: this.docContent,
          folder: this.docFolder
        }).subscribe(newDoc => {
          this.documents.next([newDoc, ...this.documents.value]);
          this.closeEditor();
        });
      }
    }
  }

  deleteDocument(id: string): void {
    this.http.delete(`${environment.apiUrl}/documents/${id}`).subscribe(() => {
      const docs = this.documents.value.filter(d => d.id !== id);
      this.documents.next(docs);
    });
  }

  closeEditor(): void {
    this.showEditor = false;
    this.editingDoc = null;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
}