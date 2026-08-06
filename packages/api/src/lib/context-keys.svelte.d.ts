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
type WhenExpression = {
    type: "identifier";
    name: string;
} | {
    type: "literal";
    value: string | number | boolean;
} | {
    type: "unary";
    operator: "!";
    operand: WhenExpression;
} | {
    type: "binary";
    operator: "&&" | "||" | "==" | "!=";
    left: WhenExpression;
    right: WhenExpression;
};
export declare function parseWhenClause(expression: string): WhenExpression;
export declare function evaluateWhenClause(expression: string | WhenExpression, lookup: (key: string) => ContextKeyValue): boolean;
export declare class ContextKeyService extends EventDispatcher<{
    change: [event: ContextKeyChangeEvent];
}> {
    #private;
    constructor(initialValues?: Record<string, ContextKeyValue>);
    get(key: string): ContextKeyValue;
    set(key: string, value: ContextKeyValue): void;
    reset(key: string): void;
    evaluate(expression: string | null | undefined): boolean;
    createScopedKey(scope: string, key: string, defaultValue?: ContextKeyValue): ScopedContextKey;
    private bump;
}
export {};
