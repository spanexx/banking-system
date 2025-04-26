import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';



export interface SupportMessage {
    _id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: 'open' | 'in-progress' | 'closed';
    createdAt: Date;
    updatedAt: Date;
  }

@Injectable({
  providedIn: 'root'
})
export class SupportMessageService {
  private apiUrl = '/api/support'; // Adjust if your API base URL is different

  constructor(private http: HttpClient) { }

  // Method to create a new support message (public)
  createSupportMessage(messageData: Omit<SupportMessage, '_id' | 'status' | 'createdAt' | 'updatedAt'>): Observable<SupportMessage> {
    const headers = this.getAuthHeaders();
    return this.http.post<SupportMessage>(this.apiUrl, messageData, { headers });
  }

  // Method for guest users to submit account opening requests
  createGuestSupportMessage(formData: FormData): Observable<SupportMessage> {
    return this.http.post<SupportMessage>(`${this.apiUrl}/guest`, formData);
  }

  // Method to get all support messages (admin only)
  getSupportMessages(): Observable<SupportMessage[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<SupportMessage[]>(this.apiUrl, { headers });
  }

  // Method to get a single support message by ID (admin only)
  getSupportMessageById(id: string): Observable<SupportMessage> {
    const headers = this.getAuthHeaders();
    return this.http.get<SupportMessage>(`${this.apiUrl}/${id}`, { headers });
  }

  // Method to update a support message by ID (admin only)
  updateSupportMessage(id: string, updateData: Partial<SupportMessage>): Observable<SupportMessage> {
    const headers = this.getAuthHeaders();
    return this.http.put<SupportMessage>(`${this.apiUrl}/${id}`, updateData, { headers });
  }

  // Method to delete a support message by ID (admin only)
  deleteSupportMessage(id: string): Observable<{ message: string }> {
    const headers = this.getAuthHeaders();
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, { headers });
  }

  // Method to delete multiple support messages by IDs (admin only)
  deleteManySupportMessages(ids: string[]): Observable<{ message: string }> {
    const headers = this.getAuthHeaders();
    return this.http.request<{ message: string }>('DELETE', this.apiUrl, {
      headers,
      body: { ids }
    });
  }

  // Method to get an image by filename
  getImage(filename: string): Observable<Blob> {
    // Remove leading '/uploads/' if present
    const cleanedFilename = filename.startsWith('/uploads/') ? filename.substring('/uploads/'.length) : filename;
    // No auth headers needed for public uploads route
    return this.http.get(`${this.apiUrl}/uploads/${cleanedFilename}`, { responseType: 'blob' });
  }

  // Helper method to get authentication headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}