import { Injectable, inject } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

const firebaseConfig = {
  apiKey: "AIzaSyCF42ESKyoR8GJT40uXmOfwQaIlkaCyqk4",
  authDomain: "prosjektravn.firebaseapp.com",
  projectId: "prosjektravn",
  storageBucket: "prosjektravn.firebasestorage.app",
  messagingSenderId: "987100666166",
  appId: "1:987100666166:web:5c79de8a4f2a6ecf6c7b97"
};

const VAPID_KEY = 'BPyv45s1OeV4fWMNOtJ4wi0b4nljhwJx9KkUC9p9P4V6Q4X285Zv6145Oly6yx2vvgmAuS8N7utxGhpX2sLXzEM';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private messaging: Messaging | null = null;
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      const app = initializeApp(firebaseConfig);
      this.messaging = getMessaging(app);
      this.setupMessageListener();
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  }

  private setupMessageListener(): void {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('Message received:', payload);
      
      if (payload.notification) {
        new Notification(payload.notification.title || 'ProsjektRavn', {
          body: payload.notification.body,
          icon: '/favicon.ico'
        });
      }
    });
  }

  private async waitForServiceWorkerActive(registration: ServiceWorkerRegistration): Promise<void> {
    if (registration.active) return;
    
    return new Promise((resolve) => {
      const sw = registration.installing || registration.waiting;
      if (!sw) {
        resolve();
        return;
      }
      
      sw.addEventListener('statechange', () => {
        if (sw.state === 'activated') {
          resolve();
        }
      });
    });
  }

  async requestPermission(): Promise<string | null> {
    try {
      if ('serviceWorker' in navigator) {
        this.swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service worker registered:', this.swRegistration);
        
        await this.waitForServiceWorkerActive(this.swRegistration);
        console.log('Service worker is active');
      }

      const permission = await Notification.requestPermission();
      
      if (permission === 'granted' && this.messaging && this.swRegistration) {
        const token = await getToken(this.messaging, { 
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: this.swRegistration
        });
        console.log('FCM Token:', token);
        
        await this.registerToken(token);
        
        return token;
      } else {
        console.log('Notification permission denied');
        return null;
      }
    } catch (error) {
      console.error('Error getting notification permission:', error);
      return null;
    }
  }

  private async registerToken(token: string): Promise<void> {
    this.http.post(`${environment.apiUrl}/notifications/register`, { token }).subscribe({
      next: () => console.log('FCM token registered with backend'),
      error: (err) => console.error('Failed to register FCM token:', err)
    });
  }
}