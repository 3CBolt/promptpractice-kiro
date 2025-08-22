import { promises as fs } from 'fs';
import * as path from 'path';
import { AttemptStatus } from '../types/contracts';

export interface IdempotencyRecord {
  attemptId: string;
  status: AttemptStatus;
  timestamp: string;
  lockExpiry?: string;
}

interface IdempotencyLedger {
  [attemptId: string]: IdempotencyRecord;
}

export class IdempotencyManager {
  private ledgerPath: string;
  private lockTimeout: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(ledgerPath: string = 'data/.idempotency.json') {
    this.ledgerPath = ledgerPath;
  }

  /**
   * Acquire a lock for processing an attempt
   * Returns true if lock was acquired, false if already locked
   */
  async acquireLock(attemptId: string): Promise<boolean> {
    const ledger = await this.loadLedger();
    const now = new Date().toISOString();
    
    // Check if attempt already exists and has an active lock
    const existing = ledger[attemptId];
    if (existing?.lockExpiry) {
      const lockExpiry = new Date(existing.lockExpiry);
      const currentTime = new Date();
      
      // If lock hasn't expired, return false
      if (lockExpiry > currentTime) {
        return false;
      }
    }

    // Acquire lock
    const lockExpiry = new Date(Date.now() + this.lockTimeout).toISOString();
    ledger[attemptId] = {
      attemptId,
      status: existing?.status || AttemptStatus.QUEUED,
      timestamp: existing?.timestamp || now,
      lockExpiry
    };

    await this.saveLedger(ledger);
    return true;
  }

  /**
   * Release the lock for an attempt
   */
  async releaseLock(attemptId: string): Promise<void> {
    const ledger = await this.loadLedger();
    
    if (ledger[attemptId]) {
      delete ledger[attemptId].lockExpiry;
      await this.saveLedger(ledger);
    }
  }

  /**
   * Get the current status of an attempt
   */
  async getStatus(attemptId: string): Promise<AttemptStatus | null> {
    const ledger = await this.loadLedger();
    return ledger[attemptId]?.status || null;
  }

  /**
   * Update the status of an attempt
   */
  async updateStatus(attemptId: string, status: AttemptStatus): Promise<void> {
    const ledger = await this.loadLedger();
    const now = new Date().toISOString();
    
    if (ledger[attemptId]) {
      ledger[attemptId].status = status;
      ledger[attemptId].timestamp = now;
    } else {
      ledger[attemptId] = {
        attemptId,
        status,
        timestamp: now
      };
    }

    await this.saveLedger(ledger);
  }

  /**
   * Check if an attempt is already being processed or completed
   */
  async isProcessed(attemptId: string): Promise<boolean> {
    const status = await this.getStatus(attemptId);
    return status !== null && status !== AttemptStatus.QUEUED;
  }

  /**
   * Clean up expired locks and old records
   */
  async cleanup(): Promise<void> {
    const ledger = await this.loadLedger();
    const now = new Date();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [attemptId, record] of Object.entries(ledger)) {
      // Remove expired locks
      if (record.lockExpiry) {
        const lockExpiry = new Date(record.lockExpiry);
        if (lockExpiry <= now) {
          delete record.lockExpiry;
        }
      }
      
      // Remove old completed records (older than 24 hours)
      const recordTime = new Date(record.timestamp);
      if (recordTime < oneDayAgo && 
          (record.status === AttemptStatus.SUCCESS || 
           record.status === AttemptStatus.ERROR ||
           record.status === AttemptStatus.TIMEOUT)) {
        delete ledger[attemptId];
      }
    }

    await this.saveLedger(ledger);
  }

  /**
   * Load the idempotency ledger from disk
   */
  private async loadLedger(): Promise<IdempotencyLedger> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.ledgerPath);
      await fs.mkdir(dataDir, { recursive: true });
      
      const data = await fs.readFile(this.ledgerPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // If file doesn't exist or is invalid, return empty ledger
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {};
      }
      console.warn('Failed to load idempotency ledger, starting fresh:', error);
      return {};
    }
  }

  /**
   * Save the idempotency ledger to disk
   */
  private async saveLedger(ledger: IdempotencyLedger): Promise<void> {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.ledgerPath);
      await fs.mkdir(dataDir, { recursive: true });
      
      await fs.writeFile(this.ledgerPath, JSON.stringify(ledger, null, 2));
    } catch (error) {
      console.error('Failed to save idempotency ledger:', error);
      throw error;
    }
  }
}

// Export a default instance
export const idempotencyManager = new IdempotencyManager();