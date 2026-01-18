import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification';

interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  dateFormat: string;
  notifications: {
    email: boolean;
    push: boolean;
    taskReminders: boolean;
    weeklyDigest: boolean;
  };
  display: {
    compactMode: boolean;
    showCompletedTasks: boolean;
    defaultView: string;
  };
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings {
  private notificationService = inject(NotificationService);
  
  settings: AppSettings = this.loadSettings();
  notificationStatus: 'default' | 'granted' | 'denied' = 'default';

  constructor() {
    if ('Notification' in window) {
      this.notificationStatus = Notification.permission;
    }
  }

  private loadSettings(): AppSettings {
    const saved = localStorage.getItem('prosjektravn-settings');
    if (saved) return JSON.parse(saved);
    return {
      theme: 'auto',
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      notifications: {
        email: true,
        push: true,
        taskReminders: true,
        weeklyDigest: false
      },
      display: {
        compactMode: false,
        showCompletedTasks: true,
        defaultView: 'board'
      }
    };
  }

  saveSettings(): void {
    localStorage.setItem('prosjektravn-settings', JSON.stringify(this.settings));
    
    if (this.settings.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (this.settings.theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  async enablePushNotifications(): Promise<void> {
    const token = await this.notificationService.requestPermission();
    if (token) {
      this.notificationStatus = 'granted';
      this.settings.notifications.push = true;
      this.saveSettings();
    } else {
      this.notificationStatus = Notification.permission;
      this.settings.notifications.push = false;
      this.saveSettings();
    }
  }

  exportData(): void {
    const data = {
      tasks: localStorage.getItem('prosjektravn-tasks'),
      projects: localStorage.getItem('prosjektravn-projects'),
      settings: localStorage.getItem('prosjektravn-settings'),
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prosjektravn-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importData(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.tasks) localStorage.setItem('prosjektravn-tasks', data.tasks);
          if (data.projects) localStorage.setItem('prosjektravn-projects', data.projects);
          if (data.settings) localStorage.setItem('prosjektravn-settings', data.settings);
          alert('Data imported successfully! Refresh the page to see changes.');
        } catch (err) {
          alert('Failed to import data. Invalid file format.');
        }
      };
      reader.readAsText(file);
    }
  }

  clearAllData(): void {
    if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      localStorage.clear();
      alert('All data cleared. Refresh the page.');
    }
  }
}