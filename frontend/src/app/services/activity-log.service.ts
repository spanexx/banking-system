import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {
  private apiUrl = '/api/activity-logs'; // Assuming this is the backend endpoint

  constructor(private http: HttpClient) { }

  getRecentActivities(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}