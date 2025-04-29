import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TransferRequestService {
  private apiUrl = `${environment.apiUrl}/transfer-requests`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  createTransferRequest(requestData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}`, requestData, { headers });
  }

  verifyTransferRequest(verificationData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/verify`, verificationData, { headers });
  }

  getTransferRequests(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.apiUrl}`, { headers });
  }

  manageTransferRequest(id: string, status: 'approved' | 'rejected'): Observable<any> {
    const headers = this.getAuthHeaders();
    // Send status in the correct format
    return this.http.put(`${this.apiUrl}/${id}/manage`, { status: status }, { headers });
  }

  deleteTransferRequest(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }
}