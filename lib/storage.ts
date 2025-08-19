import { promises as fs } from 'fs';
import { join } from 'path';
import { Attempt, Evaluation } from '@/types';
import { generateId } from './utils';

// Path utilities - configurable for testing
const getDataDir = () => process.env.NODE_ENV === 'test' ? join(process.cwd(), 'data-test') : join(process.cwd(), 'data');

function getDirectories() {
  const dataDir = getDataDir();
  return {
    DATA_DIR: dataDir,
    ATTEMPTS_DIR: join(dataDir, 'attempts'),
    EVALUATIONS_DIR: join(dataDir, 'evaluations')
  };
}

// Ensure directories exist
async function ensureDirectories(): Promise<void> {
  const { DATA_DIR, ATTEMPTS_DIR, EVALUATIONS_DIR } = getDirectories();
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(ATTEMPTS_DIR, { recursive: true });
    await fs.mkdir(EVALUATIONS_DIR, { recursive: true });
  } catch (error) {
    // Directories might already exist, ignore error
  }
}

// Attempt storage functions
export async function writeAttempt(attempt: Attempt): Promise<void> {
  await ensureDirectories();
  const { ATTEMPTS_DIR } = getDirectories();
  const filePath = join(ATTEMPTS_DIR, `${attempt.id}.json`);
  const jsonContent = JSON.stringify(attempt, null, 2); // Pretty-printed with 2-space indentation
  await fs.writeFile(filePath, jsonContent, 'utf8');
}

export async function readAttempt(attemptId: string): Promise<Attempt | null> {
  try {
    const { ATTEMPTS_DIR } = getDirectories();
    const filePath = join(ATTEMPTS_DIR, `${attemptId}.json`);
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content) as Attempt;
  } catch (error) {
    return null;
  }
}

export async function listAttempts(): Promise<string[]> {
  try {
    await ensureDirectories();
    const { ATTEMPTS_DIR } = getDirectories();
    const files = await fs.readdir(ATTEMPTS_DIR);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  } catch (error) {
    return [];
  }
}

// Evaluation storage functions
export async function writeEvaluation(evaluation: Evaluation): Promise<void> {
  await ensureDirectories();
  const { EVALUATIONS_DIR } = getDirectories();
  const filePath = join(EVALUATIONS_DIR, `${evaluation.attemptId}.json`);
  const jsonContent = JSON.stringify(evaluation, null, 2); // Pretty-printed with 2-space indentation
  await fs.writeFile(filePath, jsonContent, 'utf8');
}

export async function readEvaluation(attemptId: string): Promise<Evaluation | null> {
  try {
    const { EVALUATIONS_DIR } = getDirectories();
    const filePath = join(EVALUATIONS_DIR, `${attemptId}.json`);
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content) as Evaluation;
  } catch (error) {
    return null;
  }
}

export async function writeEvaluationError(attemptId: string, error: any): Promise<void> {
  await ensureDirectories();
  const { EVALUATIONS_DIR } = getDirectories();
  const filePath = join(EVALUATIONS_DIR, `${attemptId}.error.json`);
  const errorData = {
    attemptId,
    error: error.message || String(error),
    timestamp: new Date().toISOString(),
    stack: error.stack
  };
  const jsonContent = JSON.stringify(errorData, null, 2); // Pretty-printed with 2-space indentation
  await fs.writeFile(filePath, jsonContent, 'utf8');
}

export async function hasEvaluation(attemptId: string): Promise<boolean> {
  try {
    const { EVALUATIONS_DIR } = getDirectories();
    const filePath = join(EVALUATIONS_DIR, `${attemptId}.json`);
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

export async function hasEvaluationError(attemptId: string): Promise<boolean> {
  try {
    const { EVALUATIONS_DIR } = getDirectories();
    const filePath = join(EVALUATIONS_DIR, `${attemptId}.error.json`);
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

export async function listEvaluations(): Promise<string[]> {
  try {
    await ensureDirectories();
    const { EVALUATIONS_DIR } = getDirectories();
    const files = await fs.readdir(EVALUATIONS_DIR);
    return files
      .filter(file => file.endsWith('.json') && !file.endsWith('.error.json'))
      .map(file => file.replace('.json', ''));
  } catch (error) {
    return [];
  }
}

// Utility function to create a new attempt with generated ID
export function createAttempt(
  labId: string,
  userPrompt: string,
  models: string[],
  systemPrompt?: string
): Attempt {
  return {
    id: generateId(),
    labId,
    systemPrompt,
    userPrompt,
    models,
    createdAt: new Date().toISOString()
  };
}

// Utility function to create a new evaluation with generated ID
export function createEvaluation(
  attemptId: string,
  perModelResults: Evaluation['perModelResults']
): Evaluation {
  return {
    id: generateId(),
    attemptId,
    perModelResults,
    createdAt: new Date().toISOString()
  };
}