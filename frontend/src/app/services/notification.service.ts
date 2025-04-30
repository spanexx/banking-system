import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import io from 'socket.io-client';
import { environment } from '../../environments/environment';

export interface Notification {
  _id: string;
  userId: string;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  time: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private socket: any;

  constructor(private http: HttpClient) {
    this.socket = io(environment.wsUrl);
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('new_notification', (notification: Notification) => {
      const currentNotifications = this.notificationsSubject.value;
      this.notificationsSubject.next([notification, ...currentNotifications]);
    });
  }

  connect(userId: string) {
    this.socket.emit('authenticate', userId);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${environment.apiUrl}/notifications`).pipe(
      tap(notifications => this.notificationsSubject.next(notifications))
    );
  }

  markAsRead(id: string): Observable<Notification> {
    return this.http.put<Notification>(`${environment.apiUrl}/notifications/${id}/read`, {}).pipe(
      tap(updatedNotification => {
        const currentNotifications = this.notificationsSubject.value;
        const index = currentNotifications.findIndex(n => n._id === updatedNotification._id);
        if (index !== -1) {
          currentNotifications[index] = updatedNotification;
          this.notificationsSubject.next([...currentNotifications]);
        }
      })
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/notifications/mark-all-read`, {}).pipe(
      tap(() => {
        const currentNotifications = this.notificationsSubject.value;
        currentNotifications.forEach(n => n.read = true);
        this.notificationsSubject.next([...currentNotifications]);
      })
    );
  }

  getNotificationById(id: string): Observable<Notification> {
    return this.http.get<Notification>(`${environment.apiUrl}/notifications/${id}`);
  }

  getNotificationsByUserId(userId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${environment.apiUrl}/notifications/user/${userId}`);
  }

  deleteNotification(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/notifications/${id}`).pipe(
      tap(() => {
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.filter(n => n._id !== id);
        this.notificationsSubject.next(updatedNotifications);
      })
      );
  }
}