import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { AsyncPipe } from '@angular/common';

interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: Date;
  details: string;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  ipWhitelist: string[];
}

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [FormsModule, AsyncPipe],
  templateUrl: './security.html',
  styleUrl: './security.css'
})
export class Security {
  private auditLogs = new BehaviorSubject<AuditLog[]>(this.loadAuditLogs());
  auditLogs$ = this.auditLogs.asObservable();

  settings: SecuritySettings = this.loadSettings();
  newIp = '';

  private loadAuditLogs(): AuditLog[] {
    const saved = localStorage.getItem('prosjektravn-audit-logs');
    if (saved) return JSON.parse(saved);
    
    return [
      { id: '1', action: 'Login', user: 'You', timestamp: new Date(), details: 'Successful login' },
      { id: '2', action: 'Settings Changed', user: 'You', timestamp: new Date(Date.now() - 86400000), details: 'Updated security settings' },
    ];
  }

  private saveAuditLogs(logs: AuditLog[]): void {
    localStorage.setItem('prosjektravn-audit-logs', JSON.stringify(logs));
    this.auditLogs.next(logs);
  }

  private loadSettings(): SecuritySettings {
    const saved = localStorage.getItem('prosjektravn-security-settings');
    if (saved) return JSON.parse(saved);
    return {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      ipWhitelist: []
    };
  }

  saveSettings(): void {
    localStorage.setItem('prosjektravn-security-settings', JSON.stringify(this.settings));
    this.addAuditLog('Settings Changed', 'Security settings updated');
  }

  addIpToWhitelist(): void {
    if (this.newIp.trim() && !this.settings.ipWhitelist.includes(this.newIp.trim())) {
      this.settings.ipWhitelist.push(this.newIp.trim());
      this.newIp = '';
      this.saveSettings();
    }
  }

  removeIp(ip: string): void {
    this.settings.ipWhitelist = this.settings.ipWhitelist.filter(i => i !== ip);
    this.saveSettings();
  }

  private addAuditLog(action: string, details: string): void {
    const logs = this.auditLogs.value;
    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      action,
      user: 'You',
      timestamp: new Date(),
      details
    };
    this.saveAuditLogs([newLog, ...logs].slice(0, 50));
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  clearAuditLogs(): void {
    this.saveAuditLogs([]);
  }
}