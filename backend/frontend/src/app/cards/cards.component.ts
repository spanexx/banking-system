import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field'; // Import MatFormFieldModule
import { MatSelectModule } from '@angular/material/select'; // Import MatSelectModule
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { MatDialog } from '@angular/material/dialog'; // Import MatDialog
import { MatInputModule } from '@angular/material/input'; // Import MatInputModule
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { HttpClientModule } from '@angular/common/http';
import { CardService } from '../services/card.service';
import { AuthService } from '../services/auth.service'; // Import AuthService
import { RequestCardService } from '../services/request-card.service'; // Import RequestCardService
import { SetLimitDialogComponent } from '../set-limit-dialog/set-limit-dialog.component'; // Import SetLimitDialogComponent
import { ViewTransactionsDialogComponent } from '../view-transactions-dialog/view-transactions-dialog.component'; // Import ViewTransactionsDialogComponent
import { MessageDialogComponent } from '../shared/components/message-dialog/message-dialog.component'; // Import MessageDialogComponent
import {
  faCreditCard, 
  faPlus, 
  faLock, 
  faCog, 
  faArrowUp, 
  faArrowDown,
  faClock,
  faShieldAlt
} from '@fortawesome/free-solid-svg-icons';

interface Card {
  id: string;
  type: 'credit' | 'debit';
  lastFourDigits: string;
  expiryMonth: string;
  expiryYear: string;
  cardHolder: string;
  isBlocked: boolean;
  availableCredit?: number;
  spendingLimit?: number;
  recentTransactions: number;
}

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule, // Add MatFormFieldModule here
    MatSelectModule, // Add MatSelectModule here
    FormsModule, // Add FormsModule here
    MatInputModule, // Add MatInputModule here
    FaIconComponent,
    HttpClientModule // Add HttpClientModule here
  ],
  templateUrl: './cards.component.html',
  styleUrl: './cards.component.scss'
})
export class CardsComponent implements OnInit { // Implement OnInit
  cards: any[] = []; // Property to hold fetched cards
  isLoading: boolean = false; // Loading indicator
  errorMessage: string | null = null; // Error message
  cardHolderName: string = ''; // Property to hold card holder name

  selectedCardType: string = 'debit'; // Property to hold the selected card type
  userAccounts: any[] = []; // Property to hold user account information
  selectedAccount: any = null; // Property to hold the selected account for card request

  constructor(private cardService: CardService, private authService: AuthService, private dialog: MatDialog, private requestCardService: RequestCardService) { } // Inject CardService, AuthService, MatDialog, and RequestCardService

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        const currentUser = this.authService.getCurrentUser();
        this.cardHolderName = currentUser.name;
        if (currentUser && currentUser.accounts && currentUser.accounts.length > 0) { // Assuming the user object now includes an accounts array
          console.log('Current user accounts:', currentUser.accounts); // Log the accounts array
          this.userAccounts = currentUser.accounts; // Assign the entire accounts array
          this.selectedAccount = this.userAccounts[0]; // Set the first account as the default selected account
          console.log('User accounts:', this.userAccounts); // Log user account information
          console.log('Selected account:', this.selectedAccount); // Log selected account information
          this.getCards(); // Fetch cards when user is logged in and accountId is available
        } else {
          console.error('User logged in but account information not available or no accounts found.');
          this.errorMessage = 'Account information missing or no accounts found for the user. Please try logging in again or create an account.';
        }
      } else {
        this.userAccounts = []; // Clear account info if logged out
        this.selectedAccount = null; // Clear selected account if logged out
        this.cards = []; // Clear cards if logged out
        this.errorMessage = 'User not logged in.';
      }
    });
  }

  // We might need a new method to fetch cards based on user ID or another identifier if not by account ID
  // For now, keeping getCards but it might need adjustment depending on backend API
  getCards(): void {
    // This method might need to be updated if the backend API for fetching cards changes
    // Currently, it fetches by accountId, which we are moving away from for requesting cards.
    // If there's an API to get all accounts for a user, or cards by user ID, we'd use that here.
    // Assuming for now we might still need accountId for *fetching* existing cards,
    // but the requestNewCard will use accountNumber or IBAN.
    // TODO: Re-evaluate getCards implementation based on actual backend API for fetching cards.
    // For now, fetching cards for the selected account
    if (!this.selectedAccount || !this.selectedAccount._id) {
       console.error('Cannot fetch cards: Selected account or account ID not available.');
       this.errorMessage = 'Account information missing. Cannot fetch cards.';
       return;
    }

    this.isLoading = true; // Set loading to true
    this.errorMessage = null; // Clear previous errors
    this.cardService.getCardsByAccountId(this.selectedAccount._id).subscribe( // Still using accountId for fetching existing cards based on current backend
      (data) => {
        this.cards = data;
        this.isLoading = false; // Set loading to false on success
      },
      (error) => {
        console.error('Error fetching cards:', error);
        this.errorMessage = error.message || 'Failed to load cards. Please try again later.'; // Set error message, use error.message if available
        this.isLoading = false; // Set loading to false on error
      }
    );
  }

  // FontAwesome icons
  cardIcon = faCreditCard;
  addIcon = faPlus;
  lockIcon = faLock;
  settingsIcon = faCog;
  increaseIcon = faArrowUp;
  decreaseIcon = faArrowDown;
  historyIcon = faClock;
  securityIcon = faShieldAlt;

  requestNewCard() {
    console.log('Requesting new card');
    this.isLoading = true; // Set loading to true
    this.errorMessage = null; // Clear previous errors
    console.log('Requesting new card with type:', this.selectedCardType);

    if (!this.selectedAccount || !this.selectedAccount._id) {
      this.errorMessage = 'Please select an account to request a card.';
      this.isLoading = false;
      console.error('Cannot request new card: No account selected or account ID not available.');
      return; // Stop the function execution
    }


    this.requestCardService.createCardRequest(this.selectedAccount._id, this.selectedCardType).subscribe(
      (response) => {
        console.log('New card request submitted:', response);
        this.isLoading = false; // Set loading to false on success

        // Show success message using MessageDialogComponent
        this.dialog.open(MessageDialogComponent, {
          data: {
            message: 'Your card request has been submitted successfully.'
          }
        });

        // Optionally, clear the selected account and card type or show a success notification
      },
      (error) => {
        console.error('Error requesting new card:', error);
        this.errorMessage = error.message || 'Failed to request new card. Please try again.'; // Set error message, use error.message if available
        this.isLoading = false; // Set loading to false on error
      }
    );
  }

  toggleCardBlock(cardId: string) {
    console.log('Toggling freeze for card:', cardId);
    this.isLoading = true; // Set loading to true
    this.errorMessage = null; // Clear previous errors
    const card = this.cards.find((c: any) => c._id === cardId); // Assuming backend uses _id
    if (card) {
      const newBlockedStatus = !card.isFrozen; // Assuming backend uses isFrozen
      this.cardService.toggleCardFreeze(cardId, newBlockedStatus).subscribe(
        (response) => {
          console.log(`${newBlockedStatus ? 'Freezing' : 'Unfreezing'} card:`, cardId, response);
          card.isFrozen = newBlockedStatus; // Update the local state
          this.isLoading = false; // Set loading to false on success
        },
        (error) => {
          console.error(`Error ${newBlockedStatus ? 'freezing' : 'unfreezing'} card:`, cardId, error);
          this.errorMessage = error.message || `Failed to ${newBlockedStatus ? 'freeze' : 'unfreeze'} card. Please try again.`; // Set error message, use error.message if available
          this.isLoading = false; // Set loading to false on error
        }
      );
    } else {
      console.error('Card not found for toggling freeze:', cardId);
      this.errorMessage = 'Card not found.'; // Set error message
      this.isLoading = false; // Set loading to false
    }
  }

  setCardLimit(cardId: string, currentLimit: number | null) {
    console.log('Opening set limit dialog for card:', cardId);
    const dialogRef = this.dialog.open(SetLimitDialogComponent, {
      width: '300px',
      data: { cardId: cardId, currentLimit: currentLimit }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        console.log('Set limit dialog closed with result:', result);
        this.isLoading = true; // Set loading to true
        this.errorMessage = null; // Clear previous errors
        this.cardService.updateCardSettings(cardId, { dailyLimit: result }).subscribe(
          (response) => {
            console.log('Card limit updated:', response);
            this.getCards(); // Refresh the card list to show updated limit
            this.isLoading = false; // Set loading to false on success
          },
          (error) => {
            console.error('Error setting card limit:', error);
            this.errorMessage = 'Failed to set card limit. Please try again.'; // Set error message
            this.isLoading = false; // Set loading to false on error
          }
          );
      } else {
        console.log('Set limit dialog cancelled.');
      }
    });
  }

  viewCardTransactions(cardId: string) {
    console.log('Viewing transactions for card:', cardId);
    this.isLoading = true; // Set loading to true
    this.errorMessage = null; // Clear previous errors
    this.cardService.getCardTransactions(cardId).subscribe(
      (transactions) => {
        console.log('Transactions:', transactions);
        this.isLoading = false; // Set loading to false on success
        const dialogRef = this.dialog.open(ViewTransactionsDialogComponent, {
          width: '600px', // Adjust width as needed
          data: { transactions: transactions }
        });

        dialogRef.afterClosed().subscribe(result => {
          console.log('View transactions dialog closed.');
        });
      },
      (error) => {
        console.error('Error fetching transactions:', error);
        this.errorMessage = error.message || 'Failed to fetch transactions. Please try again.'; // Set error message, use error.message if available
        this.isLoading = false; // Set loading to false on error
      }
    );
  }

  getCardBackground(type: 'credit' | 'debit'): string {
    return type === 'credit'
      ? 'linear-gradient(135deg, #2196f3, #1565c0)'
      : 'linear-gradient(135deg, #4caf50, #2e7d32)';
  }
}
