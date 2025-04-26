import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../services/transaction.service';
import { AuthService } from '../services/auth.service';
import { CardService } from '../services/card.service';
import { AccountService } from '../services/account.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule, ActivatedRoute } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DomSanitizer } from '@angular/platform-browser';
import { forkJoin, of, mergeMap } from 'rxjs';

interface CardTransaction {
  transactionId: string;
  transactionType: string;
  amount: number;
  date: string;
  merchantDetails: string;
  card?: {
    cardNumber: string;
  };
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss'
})
export class TransactionsComponent implements OnInit {
  transactions: any[] = [];
  cardTransactions: any[] = [];
  currentUser: any;
  startDate: string = '';
  endDate: string = '';
  loading: boolean = false;
  accountId: string | null = null;
  private logoBase64: string = '';

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService,
    private cardService: CardService,
    private accountService: AccountService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadLogo();
    
    // Get accountId from query params
    this.route.queryParams.subscribe(params => {
      this.accountId = params['accountId'] || null;
      this.loadTransactions();
    });
  }

  loadTransactions() {
    this.loading = true;
    if (this.currentUser && this.currentUser._id) {
      // First, get all accounts for the user if no specific accountId is provided
      const accountsObservable = this.accountId ? 
        of([{ _id: this.accountId }]) : 
        this.accountService.getAccountsByUserId(this.currentUser._id);

      accountsObservable.subscribe({
        next: (accounts) => {
          // Create observables for each account's card transactions
          const cardTransactionObservables = accounts.map(account => 
            this.cardService.getCardsByAccountId(account._id).pipe(
              mergeMap(cards => {
                // For each card, get its transactions
                const cardTransactionObservables = cards.map((card: any) => 
                  this.cardService.getCardTransactions(card._id)
                );
                return cardTransactionObservables.length > 0 ? 
                  forkJoin(cardTransactionObservables) : 
                  of([]);
              })
            )
          );

          // Load regular transactions
          const regularTransactions = this.transactionService.getTransactionsByUserId(
            this.currentUser._id,
            this.startDate,
            this.endDate
          );

          // Combine both card and regular transactions
          forkJoin({
            cardTxns: cardTransactionObservables.length > 0 ? 
              forkJoin(cardTransactionObservables) : of([]),
            regularTxns: regularTransactions
          }).subscribe({
            next: ({ cardTxns, regularTxns }) => {
              // Format card transactions
              const formattedCardTransactions = (cardTxns as any[][])
                .flat()
                .flat() // Double flat because of nested arrays from multiple accounts/cards
                .filter((ct): ct is CardTransaction => {
                  return ct && typeof ct === 'object' && 'transactionId' in ct;
                })
                .map(ct => ({
                  transactionId: ct.transactionId,
                  type: ct.transactionType,
                  amount: ct.amount,
                  date: new Date(ct.date),
                  description: "CARD - " + ct.merchantDetails,
                  fromAccount: { accountNumber: ct.card?.cardNumber || 'Card Transaction' },
                  toAccount: { accountNumber: ct.merchantDetails?.split(' ')[0] || 'Merchant' },
                  status: 'Confirmed'
                }));

              // Combine all transactions
              this.transactions = [...formattedCardTransactions, ...regularTxns];
              
              // Sort by date
              this.transactions.sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
              );
              
              this.loading = false;
            },
            error: (error) => {
              console.error('Error loading transactions:', error);
              this.loading = false;
            }
          });
        },
        error: (error) => {
          console.error('Error loading accounts:', error);
          this.loading = false;
        }
      });
    }
  }

  private loadLogo() {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      this.logoBase64 = canvas.toDataURL('images/logo.png');
    };
    img.src = ' /images/logo.png';
  }

  applyFilter() {
    this.loadTransactions();
  }

  downloadPdf() {
    const doc = new jsPDF();
    
    // Add bank logo if loaded
    if (this.logoBase64) {
      doc.addImage(this.logoBase64, 'PNG', 10, 10, 30, 30);
    }
    
    // Add bank name
    doc.setFontSize(20);
    doc.setTextColor(21, 101, 192);
    doc.text('Simpli', 45, 25);
    
    // Add transaction statement text
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Transaction Statement', 45, 35);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 45, 42);

    // Add customer info
    doc.text(`Customer: ${this.currentUser.name}`, 10, 55);
    
    const tableColumn = ['Transaction ID', 'Type', 'Amount', 'Date', 'Description', 'From Account', 'To Account'];
    
    // Process transactions with correct signs
    const tableRows = this.transactions.map(txn => {
      // Determine if amount should be negative
      const isOutgoing = txn.type === 'withdrawal' || txn.type === 'transfer' || 
                        (txn.type === 'card' && txn.fromAccount?.accountNumber);
      const amount = isOutgoing ? -txn.amount : txn.amount;
      
      return [
        txn.transactionId,
        txn.type,
        new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          signDisplay: 'always'
        }).format(amount),
        new Date(txn.date).toLocaleDateString(),
        txn.description,
        txn.fromAccount?.accountNumber || '-',
        txn.toAccount?.accountNumber || txn.accountNumber || '-'
      ];
    });

    // Split transactions into chunks of 15 for pagination
    const chunkSize = 15;
    const chunks = [];
    for (let i = 0; i < tableRows.length; i += chunkSize) {
      chunks.push(tableRows.slice(i, i + chunkSize));
    }

    // Generate tables for each page
    chunks.forEach((chunk, index) => {
      if (index > 0) {
        doc.addPage();
      }

      autoTable(doc, {
        head: [tableColumn],
        body: chunk,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [21, 101, 192] },
        theme: 'grid',
        startY: index === 0 ? 65 : 20, // First page starts lower to accommodate header
        didDrawPage: (data) => {
          // Add page number at the bottom
          doc.setFontSize(8);
          doc.text(
            `Page ${index + 1} of ${chunks.length}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        },
      });
    });

    // Add total summary at the end
    const totalDeposits = this.transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOutgoing = this.transactions
      .filter(t => t.type === 'withdrawal' || t.type === 'transfer' || (t.type === 'card' && t.fromAccount?.accountNumber))
      .reduce((sum, t) => sum + t.amount, 0);

    doc.setFontSize(10);
    doc.text(`Total Credits: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalDeposits)}`, 14, doc.internal.pageSize.height - 25);
    doc.text(`Total Debits: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(-totalOutgoing)}`, 14, doc.internal.pageSize.height - 20);
    doc.text(`Net Change: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(totalDeposits - totalOutgoing)}`, 14, doc.internal.pageSize.height - 15);

    const fileName = `transactions_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  getStatusClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'credit';
      case 'withdrawal':
      case 'transfer':
        return 'debit';
      default:
        return '';
    }
  }
}
