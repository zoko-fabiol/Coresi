import {
  AccountingAccount,
  JournalEntry,
  JournalEntryLine,
  BankTransaction,
} from '../types/advancedModules';
import { DataService } from './dataService';
import { AdminConfigService } from './adminConfigService';

export class AccountingService {
  /**
   * Create a new journal entry with strict double-entry balance check (Débit = Crédit)
   */
  public static async createJournalEntry(params: {
    date: string;
    description: string;
    journalCode: JournalEntry['journalCode'];
    lines: Array<{
      accountCode: string;
      accountName: string;
      debit: number;
      credit: number;
      description?: string;
      projectId?: string;
      siteId?: string;
    }>;
    sourceType?: JournalEntry['sourceType'];
    sourceId?: string;
  }): Promise<JournalEntry> {
    const reference = AdminConfigService.getNextSequenceNumber('jnl');
    const id = `jnl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const formattedLines: JournalEntryLine[] = params.lines.map((l, idx) => ({
      id: `jl-${idx + 1}`,
      accountCode: l.accountCode,
      accountName: l.accountName,
      debit: l.debit || 0,
      credit: l.credit || 0,
      description: l.description,
      projectId: l.projectId,
      siteId: l.siteId,
    }));

    const totalDebit = formattedLines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredit = formattedLines.reduce((sum, l) => sum + l.credit, 0);

    // Strict balance enforcement
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `Écriture comptable déséquilibrée interdite ! Total Débit (${totalDebit.toLocaleString('fr-FR')} FCFA) ≠ Total Crédit (${totalCredit.toLocaleString('fr-FR')} FCFA). Écart : ${Math.abs(totalDebit - totalCredit).toLocaleString('fr-FR')} FCFA`
      );
    }

    const currentUser = DataService.getCurrentUser();

    const entry: JournalEntry = {
      id,
      reference,
      date: params.date,
      description: params.description,
      journalCode: params.journalCode,
      lines: formattedLines,
      totalDebit,
      totalCredit,
      isBalanced: true,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      status: 'soumise',
      createdBy: `${currentUser.displayName} (${currentUser.role.toUpperCase()})`,
      createdAt: now,
    };

    await DataService.saveJournalEntry(entry);
    return entry;
  }

  /**
   * Validate a journal entry
   */
  public static async validateJournalEntry(
    entryId: string,
    validatorName: string
  ): Promise<void> {
    const entries = DataService.getJournalEntries();
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;

    entry.status = 'validee';
    entry.validatedBy = validatorName;
    entry.validatedAt = new Date().toISOString();

    await DataService.saveJournalEntry(entry);
  }

  /**
   * Reconcile a bank transaction with a corresponding journal entry
   */
  public static async reconcileBankTransaction(
    bankTransactionId: string,
    journalEntryId: string
  ): Promise<void> {
    const txs = DataService.getBankTransactions();
    const tx = txs.find((t) => t.id === bankTransactionId);
    if (!tx) return;

    tx.reconciled = true;
    tx.reconciledWithEntryId = journalEntryId;

    await DataService.saveBankTransaction(tx);
  }

  /**
   * Computes the General Ledger (Grand Livre) from all validated journal entries
   */
  public static getGeneralLedger(): Record<
    string,
    {
      code: string;
      name: string;
      type: string;
      lines: Array<{
        date: string;
        entryRef: string;
        description: string;
        debit: number;
        credit: number;
      }>;
      totalDebit: number;
      totalCredit: number;
      balance: number;
    }
  > {
    const accounts = DataService.getAccountingAccounts();
    const entries = DataService.getJournalEntries().filter((e) => e.status === 'validee');

    const ledger: Record<string, any> = {};

    accounts.forEach((acc) => {
      ledger[acc.code] = {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        lines: [],
        totalDebit: acc.balanceDebit || 0,
        totalCredit: acc.balanceCredit || 0,
        balance: (acc.balanceDebit || 0) - (acc.balanceCredit || 0),
      };
    });

    entries.forEach((entry) => {
      entry.lines.forEach((line) => {
        if (!ledger[line.accountCode]) {
          ledger[line.accountCode] = {
            code: line.accountCode,
            name: line.accountName,
            type: 'charge',
            lines: [],
            totalDebit: 0,
            totalCredit: 0,
            balance: 0,
          };
        }
        ledger[line.accountCode].lines.push({
          date: entry.date,
          entryRef: entry.reference,
          description: line.description || entry.description,
          debit: line.debit,
          credit: line.credit,
        });
        ledger[line.accountCode].totalDebit += line.debit;
        ledger[line.accountCode].totalCredit += line.credit;
        ledger[line.accountCode].balance =
          ledger[line.accountCode].totalDebit - ledger[line.accountCode].totalCredit;
      });
    });

    return ledger;
  }

  /**
   * Computes the Trial Balance (Balance Générale des Comptes)
   */
  public static getTrialBalance(): Array<{
    code: string;
    name: string;
    type: string;
    totalDebit: number;
    totalCredit: number;
    balanceDebit: number;
    balanceCredit: number;
  }> {
    const ledger = this.getGeneralLedger();
    return Object.values(ledger)
      .map((item) => ({
        code: item.code,
        name: item.name,
        type: item.type,
        totalDebit: item.totalDebit,
        totalCredit: item.totalCredit,
        balanceDebit: item.balance > 0 ? item.balance : 0,
        balanceCredit: item.balance < 0 ? Math.abs(item.balance) : 0,
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }
}
