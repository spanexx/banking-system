import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; // Adjust the path as necessary

@Injectable({
  providedIn: 'root'
})
export class RequestCardService {
  private apiUrl = `${environment.apiUrl}/card-requests`;

  constructor(private http: HttpClient) { }

  /**
   * Requests a new card for a user's account.
   * @param accountId The ID of the account to request the card for.
   * @param cardType The type of card requested (e.g., 'visa', 'mastercard').
   * @returns An Observable with the result of the request.
   */
  createCardRequest(accountId: string, cardType: string): Observable<any> {
    return this.http.post(`${this.apiUrl}`, { accountId, cardType });
  }

  /**
   * Gets all pending card requests (Admin only).
   * @returns An Observable with a list of pending card requests.
   */
  getPendingCardRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pending`);
  }

  /**
   * Updates the status of a card request (Admin only).
   * @param requestId The ID of the card request to update.
   * @param status The new status ('approved' or 'rejected').
   * @returns An Observable with the updated card request.
   */
  updateCardRequestStatus(requestId: string, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${requestId}`, { status });
  }
}