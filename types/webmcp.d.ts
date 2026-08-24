type JsonSchema = Record<string, unknown>;

type ModelContextTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema?: JsonSchema;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (input?: unknown) => unknown | Promise<unknown>;
};

type ModelContextRegisterToolOptions = {
  signal?: AbortSignal;
  exposedTo?: string[];
};

interface ModelContext {
  registerTool(tool: ModelContextTool, options?: ModelContextRegisterToolOptions): Promise<void>;
}

interface Document {
  modelContext?: ModelContext;
}
