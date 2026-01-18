import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  category: string;
}

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './integrations.html',
  styleUrl: './integrations.css'
})
export class Integrations {
  integrations: Integration[] = [
    { id: '1', name: 'Slack', description: 'Get notifications and updates in Slack', icon: '💬', connected: false, category: 'Communication' },
    { id: '2', name: 'Microsoft Teams', description: 'Sync with Teams channels', icon: '👥', connected: false, category: 'Communication' },
    { id: '3', name: 'Google Drive', description: 'Attach files from Google Drive', icon: '📁', connected: false, category: 'Storage' },
    { id: '4', name: 'Dropbox', description: 'Link Dropbox files to tasks', icon: '📦', connected: false, category: 'Storage' },
    { id: '5', name: 'GitHub', description: 'Link commits and PRs to tasks', icon: '🐙', connected: false, category: 'Development' },
    { id: '6', name: 'GitLab', description: 'Sync issues and merge requests', icon: '🦊', connected: false, category: 'Development' },
    { id: '7', name: 'Jira', description: 'Import and sync Jira issues', icon: '📋', connected: false, category: 'Project Management' },
    { id: '8', name: 'Figma', description: 'Embed Figma designs in tasks', icon: '🎨', connected: false, category: 'Design' },
    { id: '9', name: 'Zoom', description: 'Schedule meetings from tasks', icon: '📹', connected: false, category: 'Communication' },
    { id: '10', name: 'Google Calendar', description: 'Sync due dates with calendar', icon: '📅', connected: false, category: 'Calendar' },
  ];

  categories = ['All', 'Communication', 'Storage', 'Development', 'Project Management', 'Design', 'Calendar'];
  selectedCategory = 'All';
  searchQuery = '';

  constructor() {
    this.loadIntegrations();
  }

  private loadIntegrations(): void {
    const saved = localStorage.getItem('prosjektravn-integrations');
    if (saved) {
      const savedState = JSON.parse(saved);
      this.integrations = this.integrations.map(i => ({
        ...i,
        connected: savedState[i.id] || false
      }));
    }
  }

  private saveIntegrations(): void {
    const state: Record<string, boolean> = {};
    this.integrations.forEach(i => state[i.id] = i.connected);
    localStorage.setItem('prosjektravn-integrations', JSON.stringify(state));
  }

  toggleConnection(integration: Integration): void {
    integration.connected = !integration.connected;
    this.saveIntegrations();
  }

  get filteredIntegrations(): Integration[] {
    return this.integrations.filter(i => {
      const matchesCategory = this.selectedCategory === 'All' || i.category === this.selectedCategory;
      const matchesSearch = i.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                           i.description.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  get connectedCount(): number {
    return this.integrations.filter(i => i.connected).length;
  }
}