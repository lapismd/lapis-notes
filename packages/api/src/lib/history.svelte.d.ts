export declare class HistoryManager<T> {
    readonly updater: (state: T) => void | Promise<void>;
    private historyStack;
    private currentIndex;
    private maxSize;
    hasForward: boolean;
    hasBackward: boolean;
    constructor(updater: (state: T) => void | Promise<void>, maxSize?: number);
    private limitStackSize;
    updateState(state: Partial<T>): void;
    get stack(): T[];
    pushState(state: T): void;
    replaceState(state: T): void;
    trigger(): Promise<void>;
    go(steps: number): Promise<void>;
    forward(): Promise<void>;
    back(): Promise<void>;
    canGo(steps: number): boolean;
    get history(): {
        length: number;
        state: T | null;
        currentState: () => T | null;
    };
}
