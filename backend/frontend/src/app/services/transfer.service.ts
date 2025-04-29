import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface TransferRequestData {
  fromAccountId: string;
  toAccount: string;
  amount: number;
  description?: string;
  bankName?: string;
  accountHolderName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransferService {
  private apiUrl = `${environment.apiUrl}/transfer-requests`;

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  constructor(private http: HttpClient) { }

  createTransferRequest(data: TransferRequestData): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(this.apiUrl, data , { headers });
  }

  verifyTransfer(requestId: string, code: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/verify`, { requestId, code } , { headers });
  }
}