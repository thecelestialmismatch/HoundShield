/**
 * Brain AI — Execution Context
 *
 * Provides runtime context for each Brain AI invocation:
 * user identity, session state, permissions, cost budget, and environment.
 * Brain AI original implementation for Hound Shield.
 */

import { PermissionContext, PermissionManager, createPermissionManager } from "./permissions";
import { QueryEngineConfig, defaultQueryEngineConfig } from "./models";

export interface BrainAIContext {
  sessionId: string;
  userId?: string;
  organizationId?: string;
  subscriptionTier: PermissionContext["subscriptionTier"];
  isDemo: boolean;
  model: string;
  maxTokenBudget: number;
  maxTurns: number;
  apiKey: string;
  permissionManager: PermissionManager;
  engineConfig: QueryEngineConfig;
  metadata: Record<string, unknown>;
  createdAt: number;
}

export interface ContextOptions {
  sessionId: string;
  userId?: string;
  organizationId?: string;
  subscriptionTier?: PermissionContext["subscriptionTier"];
  model?: string;
  apiKey?: string;
  maxTokenBudget?: number;
  maxTurns?: number;
  metadata?: Record<string, unknown>;
}

export function createContext(options: ContextOptions): BrainAIContext {
  const tier = options.subscriptionTier ?? "free";
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL;

  const permContext: PermissionContext = {
    sessionId: options.sessionId,
    userId: options.userId,
    subscriptionTier: tier,
    isDemo,
  };

  const engineConfig: QueryEngineConfig = {
    ...defaultQueryEngineConfig(),
    model: options.model ?? process.env.BRAIN_AI_MODEL ?? "google/gemini-flash-1.5",
    maxBudgetTokens: options.maxTokenBudget ?? 8192,
    maxTurns: options.maxTurns ?? 15,
  };

  return {
    sessionId: options.sessionId,
    userId: options.userId,
    organizationId: options.organizationId,
    subscriptionTier: tier,
    isDemo,
    model: engineConfig.model,
    maxTokenBudget: engineConfig.maxBudgetTokens,
    maxTurns: engineConfig.maxTurns,
    apiKey: options.apiKey ?? process.env.OPENROUTER_API_KEY ?? "",
    permissionManager: createPermissionManager(permContext),
    engineConfig,
    metadata: options.metadata ?? {},
    createdAt: Date.now(),
  };
}

export function updateContext(
  ctx: BrainAIContext,
  updates: Partial<ContextOptions>
): BrainAIContext {
  return createContext({
    sessionId: ctx.sessionId,
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    subscriptionTier: ctx.subscriptionTier,
    model: ctx.model,
    apiKey: ctx.apiKey,
    maxTokenBudget: ctx.maxTokenBudget,
    maxTurns: ctx.maxTurns,
    metadata: ctx.metadata,
    ...updates,
  });
}

export function contextToEngineConfig(ctx: BrainAIContext): QueryEngineConfig {
  return {
    ...ctx.engineConfig,
    model: ctx.model,
    maxBudgetTokens: ctx.maxTokenBudget,
    maxTurns: ctx.maxTurns,
  };
}
