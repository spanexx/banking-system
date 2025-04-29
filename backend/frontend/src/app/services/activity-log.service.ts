import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ActivityLogService {
  private apiUrl = `${environment.apiUrl}/activity-logs`; // Assuming this is the backend endpoint

  constructor(private http: HttpClient) { }

  getRecentActivities(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}