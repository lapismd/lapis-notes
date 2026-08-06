import { EventDispatcher } from "./events";

export type ContextKeyValue = string | number | boolean | null | undefined;

export interface ContextKeyChangeEvent {
  keys: string[];
}

export interface ScopedContextKey {
  readonly key: string;
  get(): ContextKeyValue;
  set(value: ContextKeyValue): void;
  reset(): void;
}

type WhenExpression =
  | { type: "identifier"; name: string }
  | { type: "literal"; value: string | number | boolean }
  | { type: "unary"; operator: "!"; operand: WhenExpression }
  | {
      type: "binary";
      operator: "&&" | "||" | "==" | "!=";
      left: WhenExpression;
      right: WhenExpression;
    };

type WhenToken =
  | { type: "identifier"; value: string }
  | { type: "string"; value: string }
  | { type: "number"; value: number }
  | { type: "boolean"; value: boolean }
  | {
      type: "&&" | "||" | "!" | "==" | "!=" | "(" | ")" | "eof";
    };

class WhenParser {
  #index = 0;

  constructor(private readonly tokens: WhenToken[]) {}

  parse(): WhenExpression {
    const expression = this.parseOr();
    this.expect("eof");
    return expression;
  }

  private parseOr(): WhenExpression {
    let left = this.parseAnd();
    while (this.match("||")) {
      left = {
        type: "binary",
        operator: "||",
        left,
        right: this.parseAnd(),
      };
    }
    return left;
  }

  private parseAnd(): WhenExpression {
    let left = this.parseEquality();
    while (this.match("&&")) {
      left = {
        type: "binary",
        operator: "&&",
        left,
        right: this.parseEquality(),
      };
    }
    return left;
  }

  private parseEquality(): WhenExpression {
    let left = this.parseUnary();
    while (true) {
      if (this.match("==")) {
        left = {
          type: "binary",
          operator: "==",
          left,
          right: this.parseUnary(),
        };
        continue;
      }
      if (this.match("!=")) {
        left = {
          type: "binary",
          operator: "!=",
          left,
          right: this.parseUnary(),
        };
        continue;
      }
      return left;
    }
  }

  private parseUnary(): WhenExpression {
    if (this.match("!")) {
      return {
        type: "unary",
        operator: "!",
        operand: this.parseUnary(),
      };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): WhenExpression {
    const token = this.current();
    if (token.type === "identifier") {
      this.#index += 1;
      return { type: "identifier", name: token.value };
    }
    if (
      token.type === "string" ||
      token.type === "number" ||
      token.type === "boolean"
    ) {
      this.#index += 1;
      return { type: "literal", value: token.value };
    }
    if (this.match("(")) {
      const expression = this.parseOr();
      this.expect(")");
      return expression;
    }
    throw new Error(`Unexpected token ${describeToken(token)}`);
  }

  private current(): WhenToken {
    return this.tokens[this.#index] ?? { type: "eof" };
  }

  private match(type: WhenToken["type"]): boolean {
    if (this.current().type !== type) {
      return false;
    }
    this.#index += 1;
    return true;
  }

  private expect(type: WhenToken["type"]): void {
    if (!this.match(type)) {
      throw new Error(
        `Expected ${type}, received ${describeToken(this.current())}`,
      );
    }
  }
}

function describeToken(token: WhenToken): string {
  return token.type === "identifier"
    ? `identifier ${token.value}`
    : token.type === "string"
      ? `string ${JSON.stringify(token.value)}`
      : token.type === "number"
        ? `number ${token.value}`
        : token.type === "boolean"
          ? `boolean ${token.value}`
          : token.type;
}

function tokenizeWhenClause(expression: string): WhenToken[] {
  const tokens: WhenToken[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    const pair = expression.slice(index, index + 2);
    if (pair === "&&" || pair === "||" || pair === "==" || pair === "!=") {
      tokens.push({ type: pair });
      index += 2;
      continue;
    }

    if (char === "!" || char === "(" || char === ")") {
      tokens.push({ type: char });
      index += 1;
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      index += 1;
      let value = "";
      while (index < expression.length) {
        const next = expression[index];
        if (next === "\\") {
          const escaped = expression[index + 1];
          if (escaped === undefined) {
            throw new Error("Unterminated string literal");
          }
          value += escaped;
          index += 2;
          continue;
        }
        if (next === quote) {
          index += 1;
          tokens.push({ type: "string", value });
          value = "";
          break;
        }
        value += next;
        index += 1;
      }
      if (value !== "") {
        throw new Error("Unterminated string literal");
      }
      continue;
    }

    const numberMatch = expression.slice(index).match(/^\d+(?:\.\d+)?/);
    if (numberMatch) {
      tokens.push({ type: "number", value: Number(numberMatch[0]) });
      index += numberMatch[0].length;
      continue;
    }

    const identifierMatch = expression
      .slice(index)
      .match(/^[A-Za-z_][A-Za-z0-9_.-]*/);
    if (identifierMatch) {
      const value = identifierMatch[0];
      if (value === "true" || value === "false") {
        tokens.push({ type: "boolean", value: value === "true" });
      } else {
        tokens.push({ type: "identifier", value });
      }
      index += value.length;
      continue;
    }

    throw new Error(`Unexpected character ${JSON.stringify(char)}`);
  }

  tokens.push({ type: "eof" });
  return tokens;
}

export function parseWhenClause(expression: string): WhenExpression {
  return new WhenParser(tokenizeWhenClause(expression)).parse();
}

export function evaluateWhenClause(
  expression: string | WhenExpression,
  lookup: (key: string) => ContextKeyValue,
): boolean {
  const parsed =
    typeof expression === "string" ? parseWhenClause(expression) : expression;
  return Boolean(evaluateExpression(parsed, lookup));
}

function evaluateExpression(
  expression: WhenExpression,
  lookup: (key: string) => ContextKeyValue,
): ContextKeyValue {
  switch (expression.type) {
    case "identifier":
      return lookup(expression.name);
    case "literal":
      return expression.value;
    case "unary":
      return !Boolean(evaluateExpression(expression.operand, lookup));
    case "binary": {
      if (expression.operator === "&&") {
        return (
          Boolean(evaluateExpression(expression.left, lookup)) &&
          Boolean(evaluateExpression(expression.right, lookup))
        );
      }
      if (expression.operator === "||") {
        return (
          Boolean(evaluateExpression(expression.left, lookup)) ||
          Boolean(evaluateExpression(expression.right, lookup))
        );
      }
      const left = evaluateExpression(expression.left, lookup);
      const right = evaluateExpression(expression.right, lookup);
      return expression.operator === "==" ? left === right : left !== right;
    }
  }
}

export class ContextKeyService extends EventDispatcher<{
  change: [event: ContextKeyChangeEvent];
}> {
  #values = new Map<string, ContextKeyValue>();
  #parsedExpressions = new Map<string, WhenExpression>();
  #version = $state(0);

  constructor(initialValues: Record<string, ContextKeyValue> = {}) {
    super();
    for (const [key, value] of Object.entries(initialValues)) {
      this.#values.set(key, value);
    }
  }

  get(key: string): ContextKeyValue {
    this.#version;
    return this.#values.get(key);
  }

  set(key: string, value: ContextKeyValue): void {
    if (this.#values.get(key) === value && this.#values.has(key)) {
      return;
    }
    this.#values.set(key, value);
    this.bump([key]);
  }

  reset(key: string): void {
    if (!this.#values.delete(key)) {
      return;
    }
    this.bump([key]);
  }

  evaluate(expression: string | null | undefined): boolean {
    this.#version;
    if (!expression?.trim()) {
      return true;
    }
    try {
      const parsed =
        this.#parsedExpressions.get(expression) ?? parseWhenClause(expression);
      this.#parsedExpressions.set(expression, parsed);
      return evaluateWhenClause(parsed, (key) => this.#values.get(key));
    } catch {
      return false;
    }
  }

  createScopedKey(
    scope: string,
    key: string,
    defaultValue?: ContextKeyValue,
  ): ScopedContextKey {
    const scopedKey = `${scope}.${key}`;
    if (defaultValue !== undefined) {
      this.set(scopedKey, defaultValue);
    }
    return {
      key: scopedKey,
      get: () => this.get(scopedKey),
      set: (value) => this.set(scopedKey, value),
      reset: () => this.reset(scopedKey),
    };
  }

  private bump(keys: string[]): void {
    this.#version += 1;
    this.emit("change", { keys });
  }
}
