import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  navGroups = [
    {
      title: 'Core',
      items: [
        { label: 'Dashboard', route: '/dashboard' },
        { label: 'Tasks', route: '/tasks' },
        { label: 'Projects', route: '/projects' },
        { label: 'Planning & Scheduling', route: '/planning' }
      ]
    },
    {
      title: 'Collaboration',
      items: [
        { label: 'Collaborations', route: '/collaborations' },
        { label: 'File-Sharing & Approvals', route: '/files' }
      ]
    },
    {
      title: 'Insights',
      items: [
        { label: 'Analytics & Reporting', route: '/analytics' },
        { label: 'Document Management', route: '/documents' },
        { label: 'Resource Management', route: '/resources' }
      ]
    },
    {
      title: 'System',
      items: [
        { label: 'Integrations', route: '/integrations' },
        { label: 'Security', route: '/security' },
        { label: 'Support', route: '/support' },
        { label: 'Settings', route: '/settings' }
      ]
    }
  ];

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
