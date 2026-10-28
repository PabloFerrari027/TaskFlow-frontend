// Regras e modelos da IA por plano — tela de admin (API.md § 30).

export type AiRuleKind = "PROMPT" | "BEHAVIOR";
/** "none": sem raciocínio — o gpt-5.4-nano/mini só aceitam ações (tools) na conversa assim. */
export type AiReasoningEffort = "none" | "low" | "medium" | "high";

export interface AiRule {
  id: string;
  key: string;
  /** PROMPT = frase que o assistente lê; BEHAVIOR = trava do servidor (só liga e desliga). */
  kind: AiRuleKind;
  title: string;
  text: string;
  isProtected: boolean;
  isBuiltin: boolean;
  /** Regra pronta com o texto mudado — dá para restaurar o original. */
  isCustomized: boolean;
  /** Título da regra da qual esta depende. */
  requires: string | null;
  enabledByPlan: Record<string, boolean>;
}

export interface AiRuleGroup {
  key: string;
  name: string;
  description: string;
  isProtected: boolean;
  enabledByPlan: Record<string, boolean>;
  rules: AiRule[];
}

export interface AiTaskModel {
  /** "fornecedor:modelo" */
  model: string;
  reasoningEffort: string | null;
}

export interface AiTask {
  task: string;
  label: string;
  description: string;
  serverDefault: AiTaskModel;
  /** `null` = o plano usa o padrão do servidor. */
  byPlan: Record<string, AiTaskModel | null>;
}

export interface AiSettings {
  plans: Array<{ id: string; name: string }>;
  groups: AiRuleGroup[];
  tasks: AiTask[];
  /** Fornecedores com chave no servidor — só eles podem ser escolhidos. */
  providers: string[];
}

export interface AiRuleInput {
  title: string;
  text: string;
}
