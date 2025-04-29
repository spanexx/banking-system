export interface Transaction {
  _id?: string;
  transactionId?: string;
  
  toAccount: AccountRef; // Account ObjectId
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  IBAN: string;
  accountNumber: string;
  swiftCode: string;
  date: Date;
  description?: string;
  fromAccount?: AccountRef; // Account ObjectId
  requestTransferId?: string; // Link to the transfer request
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AccountRef {
    _id: string;
    accountNumber: string;
  }