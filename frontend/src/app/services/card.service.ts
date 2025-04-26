import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private apiUrl = '/api/cards'; // Adjust if your API base URL is different

  constructor(private http: HttpClient) { }

  getCardsByAccountId(accountId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${accountId}`);
  }

  requestNewCard(cardRequest: { accountNumber?: string, IBAN?: string, cardType: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/request`, cardRequest);
  }

  toggleCardFreeze(cardId: string, isFrozen: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/${cardId}/freeze`, { isFrozen });
  }

  updateCardSettings(cardId: string, settings: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${cardId}/settings`, settings);
  }

  getCardTransactions(cardId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${cardId}/transactions`);
  }

  // Add methods for available credit and credit limit if needed
}