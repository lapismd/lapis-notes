interface DomElementInfo {
  /**
   * The class to be assigned. Can be a space-separated string or an array of
   * strings.
   */
  cls?: string | string[];
  /** The textContent to be assigned. */
  text?: string | DocumentFragment;
  /** HTML attributes to be added. */
  attr?: {
    [key: string]: string | number | boolean | null;
  };
  /** HTML title (for hover tooltip). */
  title?: string;
  /** The parent element to be assigned toptions. */
  parent?: Node;
  value?: string;
  type?: string;
  prepend?: boolean;
  placeholder?: string;
  href?: string;
}

interface SvgElementInfo {
  /**
   * The class to be assigned. Can be a space-separated string or an array of
   * strings.
   */
  cls?: string | string[];
  /** HTML attributes to be added. */
  attr?: {
    [key: string]: string | number | boolean | null;
  };
  /** The parent element to be assigned to. */
  parent?: Node;
  prepend?: boolean;
}

declare global {
  interface Window {
    /**
     * The actively focused Window object. This is usually the same as `window`
     * but it will be different when using popout windows.
     */
    activeWindow: Window;
    /**
     * The actively focused Document object. This is usually the same as
     * `document` but it will be different when using popout windows.
     */
    activeDocument: Document;
  }

  interface Node {
    detach(): void;
    empty(): void;
    insertAfter<T extends Node>(node: T, child: Node | null): T;
    appendText(val: string): void;

    createEl<K extends keyof HTMLElementTagNameMap>(
      tag: K,
      o?: DomElementInfo | string,
      callback?: (el: HTMLElementTagNameMap[K]) => void,
    ): HTMLElementTagNameMap[K];
    createDiv(
      o?: DomElementInfo | string,
      callback?: (el: HTMLDivElement) => void,
    ): HTMLDivElement;
    createSpan(
      o?: DomElementInfo | string,
      callback?: (el: HTMLSpanElement) => void,
    ): HTMLSpanElement;
    createSvg<K extends keyof SVGElementTagNameMap>(
      tag: K,
      options?: SvgElementInfo | string,
      callback?: (el: SVGElementTagNameMap[K]) => void,
    ): SVGElementTagNameMap[K];
    /** The document this node belongs to, or the global document. */
    doc: Document;
    /** The window object this node belongs to, or the global window. */
    win: Window;
    constructorWin: Window;
  }

  interface Element extends Node {
    find(selector: string): Element | null;
    findAll(selector: string): HTMLElement[];
    findAllSelf(selector: string): HTMLElement[];

    getText(): string;
    setText(val: string | DocumentFragment): void;
    addClass(...classes: string[]): void;
    addClasses(classes: string[]): void;
    removeClass(...classes: string[]): void;
    removeClasses(classes: string[]): void;
    toggleClass(classes: string | string[], value: boolean): void;
    hasClass(cls: string): boolean;
    setAttr(
      qualifiedName: string,
      value: string | number | boolean | null,
    ): void;
    setAttrs(obj: { [key: string]: string | number | boolean | null }): void;
    getAttr(qualifiedName: string): string | null;
    matchParent(selector: string, lastParent?: Element): Element | null;
    getCssPropertyValue(property: string, pseudoElement?: string): string;
    isActiveElement(): boolean;
  }

  interface EventListenerInfo {
    selector: string;
    listener: Function;
    options?: boolean | AddEventListenerOptions;
    callback: Function;
  }

  interface HTMLElement extends Element {
    _EVENTS?: {
      [K in keyof HTMLElementEventMap]?: EventListenerInfo[];
    };
    show(): void;
    hide(): void;
    toggle(show: boolean): void;
    toggleVisibility(visible: boolean): void;
    scrollOffsetTop(): number;

    on<K extends keyof HTMLElementEventMap>(
      this: HTMLElement,
      type: K,
      selector: string,
      listener: (
        this: HTMLElement,
        ev: HTMLElementEventMap[K],
        delegateTarget: HTMLElement,
      ) => any,
      options?: boolean | AddEventListenerOptions,
    ): void;
    off<K extends keyof HTMLElementEventMap>(
      this: HTMLElement,
      type: K,
      selector: string,
      listener: (
        this: HTMLElement,
        ev: HTMLElementEventMap[K],
        delegateTarget: HTMLElement,
      ) => any,
      options?: boolean | AddEventListenerOptions,
    ): void;

    onClickEvent(
      this: HTMLElement,
      listener: (this: HTMLElement, ev: MouseEvent) => any,
      options?: boolean | AddEventListenerOptions,
    ): void;
  }

  function createEl<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    options?: DomElementInfo | string,
    callback?: (el: HTMLElementTagNameMap[K]) => void,
  ): HTMLElementTagNameMap[K];

  function createSpan(
    options?: DomElementInfo | string,
    callback?: (el: HTMLSpanElement) => void,
  ): HTMLSpanElement;

  function createDiv(
    options?: DomElementInfo | string,
    callback?: (el: HTMLDivElement) => void,
  ): HTMLDivElement;

  function createSvg<K extends keyof SVGElementTagNameMap>(
    tag: K,
    options?: SvgElementInfo | string,
    callback?: (el: SVGElementTagNameMap[K]) => void,
  ): SVGElementTagNameMap[K];

  function createFragment(
    callback?: (el: DocumentFragment) => void,
  ): DocumentFragment;
}

// <TypeDefs />

if (
  typeof Node !== "undefined" &&
  typeof Element !== "undefined" &&
  typeof HTMLElement !== "undefined" &&
  typeof Window !== "undefined" &&
  typeof document !== "undefined" &&
  typeof window !== "undefined"
) {
  Node.prototype.constructorWin = window;

  Window.prototype.activeWindow = window;
  Window.prototype.activeDocument = document;

  Object.defineProperty(Node.prototype, "doc", {
    get() {
      return this.ownerDocument || document;
    },
    configurable: true,
  });

  Object.defineProperty(Node.prototype, "win", {
    get() {
      return this.doc.defaultView || window;
    },
    configurable: true,
  });

  Node.prototype.detach = function () {
    this.parentNode && this.parentNode.removeChild(this);
  };

  Node.prototype.empty = function () {
    for (; this.lastChild; ) {
      this.removeChild(this.lastChild);
    }
  };

  Node.prototype.insertAfter = function <T extends Node>(
    node: T,
    child: Node | null,
  ): T {
    child
      ? this.insertBefore(node, child.nextSibling)
      : this.insertBefore(node, this.firstChild);
    return node;
  };

  Node.prototype.appendText = function (val: string) {
    this.appendChild(document.createTextNode(val));
  };

  Node.prototype.createEl = function <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    o?: DomElementInfo | string,
    callback?: (el: HTMLElementTagNameMap[K]) => void,
  ): HTMLElementTagNameMap[K] {
    if (typeof o === "string") {
      o = { cls: o };
    }
    (o = o || {}).parent = this;
    return createEl(tag, o, callback);
  };

  Node.prototype.createSpan = function (
    o?: DomElementInfo | string,
    callback?: (el: HTMLSpanElement) => void,
  ): HTMLSpanElement {
    return this.createEl("span", o, callback);
  };

  Node.prototype.createDiv = function (
    o?: DomElementInfo | string,
    callback?: (el: HTMLDivElement) => void,
  ): HTMLDivElement {
    return this.createEl("div", o, callback);
  };

  Node.prototype.createDiv = function createDiv(
    o?: DomElementInfo | string,
    callback?: (el: HTMLDivElement) => void,
  ): HTMLDivElement {
    return this.createEl("div", o, callback);
  };

  Node.prototype.createSpan = function createSpan(
    o?: DomElementInfo | string,
    callback?: (el: HTMLSpanElement) => void,
  ): HTMLSpanElement {
    return this.createEl("span", o, callback);
  };

  Node.prototype.createSvg = function createSvg<
    K extends keyof SVGElementTagNameMap,
  >(
    tag: K,
    options?: SvgElementInfo | string,
    callback?: (el: SVGElementTagNameMap[K]) => void,
  ): SVGElementTagNameMap[K] {
    if (typeof options === "string") {
      options = { cls: options };
    }
    (options = options || {}).parent = this;
    return createSvg(tag, options, callback);
  };

  function getText(node: Node): string {
    var nodeType = node.nodeType;
    if ([1, 9, 11].includes(nodeType)) {
      if (typeof node.textContent == "string") {
        return node.textContent;
      }
      for (
        var nodes = [], child = node.firstChild;
        child;
        child = child.nextSibling
      )
        nodes.push(getText(child));
      return nodes.join("");
    }
    return ([3, 4].includes(nodeType) && node.nodeValue) || "";
  }

  Element.prototype.find = function (selector: string) {
    return this.querySelector(selector);
  };

  Element.prototype.findAll = function (selector: string) {
    return Array.from(this.querySelectorAll(selector));
  };

  Element.prototype.findAllSelf = function (selector: string) {
    return Array.from(this.querySelectorAll(selector));
  };

  Element.prototype.getText = function () {
    return getText(this);
  };

  Element.prototype.setText = function (
    value: string | DocumentFragment | Node,
  ) {
    if (value instanceof DocumentFragment || value instanceof Node) {
      this.empty();
      this.appendChild(value);
    } else if (
      typeof value === "string" &&
      [1, 9, 11].includes(this.nodeType)
    ) {
      this.textContent = value;
    }
  };

  Element.prototype.addClass = function (...classes: string[]) {
    this.addClasses(classes);
  };

  Element.prototype.addClasses = function (classes: string[]) {
    if (classes) {
      classes.forEach((it) => this.classList.add(it));
    }
  };

  Element.prototype.removeClass = function (...classes: string[]) {
    this.removeClasses(classes);
  };

  Element.prototype.removeClasses = function (classes: string[]) {
    if (classes) {
      classes.forEach((it) => this.classList.remove(it));
    }
  };

  Element.prototype.toggleClass = function (
    classes: string | string[],
    value: boolean,
  ) {
    if (!Array.isArray(classes)) {
      classes = [classes];
    }
    value ? this.addClasses(classes) : this.removeClasses(classes);
  };

  Element.prototype.hasClass = function (cls: string) {
    return this.classList.contains(cls);
  };

  Element.prototype.getAttr = function (qualifiedName: string) {
    return this.getAttribute(qualifiedName);
  };

  Element.prototype.setAttr = function (
    qualifiedName: string,
    value: string | number | boolean | null,
  ) {
    value === null
      ? this.removeAttribute(qualifiedName)
      : this.setAttribute(qualifiedName, String(value));
  };

  Element.prototype.setAttrs = function (obj: {
    [key: string]: string | number | boolean | null;
  }) {
    for (const [key, value] of Object.entries(obj)) {
      this.setAttr(key, value);
    }
  };

  Element.prototype.getCssPropertyValue = function (
    property: string,
    pseudoElement?: string,
  ): string {
    return getComputedStyle(this, pseudoElement)
      .getPropertyValue(property)
      .trim();
  };

  Element.prototype.matchParent = function (
    selector: string,
    lastParent?: Element,
  ): Element | null {
    if (this.matches(selector)) {
      return this;
    }
    if (this === lastParent) {
      return null;
    }
    const p = this.parentElement;
    return p ? p.matchParent(selector, lastParent) : null;
  };

  Element.prototype.isActiveElement = function () {
    return false;
  };

  HTMLElement.prototype.scrollOffsetTop = function (this: HTMLElement): number {
    let currenttop = 0;
    let el = this;
    if (el.offsetParent) {
      do {
        currenttop += el.offsetTop;
      } while ((el = el.offsetParent as HTMLElement));
      return currenttop;
    }
    return currenttop;
  };

  HTMLElement.prototype.on = function <K extends keyof HTMLElementEventMap>(
    this: HTMLElement,
    type: K,
    selector: string,
    listener: (
      this: HTMLElement,
      ev: HTMLElementEventMap[K],
      delegateTarget: HTMLElement,
    ) => any,
    options?: boolean | AddEventListenerOptions,
  ) {
    const delegateTarget = this;
    const callback = (event: HTMLElementEventMap[K]) => {
      const target = event.target as HTMLElement;
      if (target && target.matches(selector)) {
        listener.bind(delegateTarget)(event, delegateTarget);
      }
    };

    this.addEventListener(type, callback, options);
    const info: EventListenerInfo = { selector, listener, options, callback };
    this._EVENTS ||= {};
    this._EVENTS[type] ||= [];
    this._EVENTS[type].push(info);
  };

  HTMLElement.prototype.off = function <K extends keyof HTMLElementEventMap>(
    this: HTMLElement,
    type: K,
    selector: string,
    listener: (
      this: HTMLElement,
      ev: HTMLElementEventMap[K],
      delegateTarget: HTMLElement,
    ) => any,
    options?: boolean | AddEventListenerOptions,
  ) {
    this._EVENTS ||= {};
    this._EVENTS[type] ||= [];
    const events = this._EVENTS[type].filter(
      (it) => it.selector === selector && it.listener === listener,
    );
    events.forEach((evt) => {
      this.removeEventListener(
        type,
        evt.listener as (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
        evt.options,
      );
    });
    this._EVENTS[type] = this._EVENTS[type].filter(
      (it) => !(it.selector === selector && it.listener === listener),
    );
  };

  HTMLElement.prototype.onClickEvent = function (
    this: HTMLElement,
    listener: (this: HTMLElement, ev: MouseEvent) => any,
    options?: boolean | AddEventListenerOptions,
  ) {
    this.addEventListener("click", listener, options);
    this.addEventListener("auxclick", listener, options);
  };

  HTMLElement.prototype.show = function () {
    if (this.style.display === "none") {
      this.style.display = this.getAttribute("data-display") || "";
      this.removeAttribute("data-display");
    }
  };

  HTMLElement.prototype.hide = function () {
    const display = this.style.display;
    if (display !== "none") {
      this.style.display = "none";
      display
        ? this.setAttribute("data-display", display)
        : this.removeAttribute("data-display");
    }
  };

  HTMLElement.prototype.toggle = function (show: boolean) {
    show ? this.show() : this.hide();
  };

  HTMLElement.prototype.toggleVisibility = function (visible: boolean) {
    this.style.visibility = visible ? "" : "hidden";
  };

  globalThis.createFragment = function (
    callback?: (el: DocumentFragment) => void,
  ): DocumentFragment {
    const fragment = document.createDocumentFragment();
    callback?.(fragment);
    return fragment;
  };

  globalThis.createEl = function <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    options?: DomElementInfo | string,
    callback?: (el: HTMLElementTagNameMap[K]) => void,
  ): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    if (typeof options === "string") {
      el.classList.add(...options.split(" ").filter((it) => it));
    } else if (options) {
      if (options.cls) {
        if (typeof options.cls === "string") {
          el.classList.add(...options.cls.split(" ").filter((it) => it));
        } else {
          el.classList.add(...options.cls);
        }
      }

      if (options.title) {
        el.title = options.title;
      }

      if (options.parent) {
        options.prepend
          ? options.parent.insertBefore(el, options.parent.firstChild)
          : options.parent.appendChild(el);
      }

      if (options.value !== undefined) {
        if (
          el instanceof HTMLInputElement ||
          el instanceof HTMLSelectElement ||
          el instanceof HTMLOptionElement
        ) {
          el.value = options.value;
        }
      }

      if (options.type) {
        if (el instanceof HTMLInputElement) {
          el.type = options.type;
        } else if (el instanceof HTMLStyleElement) {
          el.setAttribute("type", options.type);
        }
      }

      if (options.href !== undefined) {
        if (
          el instanceof HTMLAnchorElement ||
          el instanceof HTMLLinkElement ||
          el instanceof HTMLBaseElement
        ) {
          el.href = options.href;
        }
      }

      if (options.text !== undefined) {
        el.setText(options.text);
      }

      if (options.attr) {
        el.setAttrs(options.attr);
      }
    }
    callback?.(el);
    return el;
  };

  globalThis.createSpan = function (
    options?: DomElementInfo | string,
    callback?: (el: HTMLSpanElement) => void,
  ): HTMLSpanElement {
    return createEl("span", options, callback);
  };

  globalThis.createDiv = function (
    options?: DomElementInfo | string,
    callback?: (el: HTMLDivElement) => void,
  ): HTMLDivElement {
    return createEl("div", options, callback);
  };

  globalThis.createSvg = function <K extends keyof SVGElementTagNameMap>(
    tag: K,
    options?: SvgElementInfo | string,
    callback?: (el: SVGElementTagNameMap[K]) => void,
  ): SVGElementTagNameMap[K] {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    if (typeof options === "string") {
      el.classList.add(...options.split(" ").filter((it) => it));
    } else if (options) {
      if (options.cls) {
        if (typeof options.cls === "string") {
          el.classList.add(...options.cls.split(" ").filter((it) => it));
        } else {
          el.classList.add(...options.cls);
        }
      }

      if (options.attr) {
        for (const [key, value] of Object.entries(options.attr)) {
          el.setAttribute(key, value?.toString() ?? "");
        }
      }

      if (options.parent) {
        options.prepend
          ? options.parent.insertBefore(el, options.parent.firstChild)
          : options.parent.appendChild(el);
      }
    }
    callback?.(el);

    return el;
  };
}

export {};
