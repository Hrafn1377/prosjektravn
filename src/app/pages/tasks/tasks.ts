import { Component } from '@angular/core';
import { KanbanBoardComponent } from '../../components/kanban-board/kanban-board';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [KanbanBoardComponent],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css'
})
export class Tasks {}