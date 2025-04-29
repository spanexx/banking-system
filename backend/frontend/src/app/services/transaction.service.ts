import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class TransactionService {
  private apiUrl = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getTransactions(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(this.apiUrl, { headers });
  }

  getAllTransactions(startDate?: string, endDate?: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    let params: any = {};
    if (startDate) {
      params.startDate = startDate;
    }
    if (endDate) {
      params.endDate = endDate;
    }
    return this.http.get<any[]>(`${this.apiUrl}/all`, { params, headers });
  }
     

  createTransaction(transactionData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.apiUrl, transactionData, { headers });
  }

  getTransactionsByUserId(userId: string, startDate?: string, endDate?: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    let params: any = {};
    if (startDate) {
      params.startDate = startDate;
    }
    if (endDate) {
      params.endDate = endDate;
    }
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`, { params, headers });
  }

  requestTransfer(transactionData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/request-transfer`, transactionData, { headers });
  }

  updateTransactionStatus(transactionId: string, status: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.apiUrl}/${transactionId}/status`, { status }, { headers });
  }

  getTransactionByRequestId(requestId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/by-request/${requestId}`, { headers });
  }

  createCardTransaction(transactionData: { cardNumber: string, expiryDate: string, cvv: string, amount: number, merchantDetails: string, transactionType: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/card`, transactionData, { headers });
  }

  cancelTransferRequestAndReturnFunds(requestId: string, description: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/cancel-transfer`, { _id: requestId, description }, { headers });
  }
}
