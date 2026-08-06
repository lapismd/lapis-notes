/** @public */
export const SETTING_SECTION_CLASS = "setting-section";

/** @public */
export const SETTING_SECTION_HEADING_CLASS =
  "setting-section-heading setting-control-heading";

/** @public */
export const SETTING_SECTION_HEADING_TITLE_CLASS =
  "setting-section-heading-title";

/** @public */
export const SETTING_SECTION_HEADING_DESCRIPTION_CLASS =
  "setting-section-heading-description";

/** @public */
export const SETTING_SECTION_HEADING_ACTIONS_CLASS =
  "setting-section-heading-actions";

/** @public */
export const SETTING_SECTION_BODY_CLASS = "setting-section-body";

const PLUGIN_TAB_CLASS = "workspace-shell__settings-plugin-tab";

type SettingContainerState = {
  activeBodyEl: HTMLElement | null;
  implicitSectionEl: HTMLElement | null;
};

const settingContainerStates = new WeakMap<
  HTMLElement,
  SettingContainerState
>();

function usesSettingSectionLayout(rootEl: HTMLElement): boolean {
  return (
    rootEl.classList.contains(PLUGIN_TAB_CLASS) ||
    rootEl.classList.contains(SETTING_SECTION_CLASS) ||
    rootEl.classList.contains("workspace-shell__settings-schema-form")
  );
}

function getContainerState(
  rootEl: HTMLElement,
): SettingContainerState | undefined {
  const state = settingContainerStates.get(rootEl);
  if (!state) {
    return undefined;
  }

  if (state.activeBodyEl && !state.activeBodyEl.isConnected) {
    settingContainerStates.delete(rootEl);
    return undefined;
  }

  if (state.implicitSectionEl && !state.implicitSectionEl.isConnected) {
    settingContainerStates.delete(rootEl);
    return undefined;
  }

  return state;
}

function ensureContainerState(rootEl: HTMLElement): SettingContainerState {
  const existing = getContainerState(rootEl);
  if (existing) {
    return existing;
  }

  const state: SettingContainerState = {
    activeBodyEl: null,
    implicitSectionEl: null,
  };
  settingContainerStates.set(rootEl, state);
  return state;
}

function createSettingSection(rootEl: HTMLElement): {
  sectionEl: HTMLElement;
  bodyEl: HTMLElement;
} {
  const sectionEl = rootEl.createDiv({ cls: SETTING_SECTION_CLASS });
  const bodyEl = sectionEl.createDiv({ cls: SETTING_SECTION_BODY_CLASS });
  return { sectionEl, bodyEl };
}

function ensureImplicitSettingBody(rootEl: HTMLElement): HTMLElement {
  const state = ensureContainerState(rootEl);
  if (state.activeBodyEl?.isConnected) {
    return state.activeBodyEl;
  }

  const { sectionEl, bodyEl } = createSettingSection(rootEl);
  state.implicitSectionEl = sectionEl;
  state.activeBodyEl = bodyEl;
  return bodyEl;
}

export function getSettingMountEl(rootEl: HTMLElement): HTMLElement {
  const state = getContainerState(rootEl);
  if (state?.activeBodyEl?.isConnected) {
    return state.activeBodyEl;
  }

  if (usesSettingSectionLayout(rootEl)) {
    return ensureImplicitSettingBody(rootEl);
  }

  return rootEl;
}

export function takeElementContent(el: HTMLElement): string | DocumentFragment {
  if (el.childNodes.length === 0) {
    return "";
  }

  if (
    el.childNodes.length === 1 &&
    el.firstChild?.nodeType === Node.TEXT_NODE
  ) {
    const text = el.textContent ?? "";
    el.empty();
    return text;
  }

  const fragment = document.createDocumentFragment();
  while (el.firstChild) {
    fragment.appendChild(el.firstChild);
  }

  return fragment;
}

export function openSettingSection(
  rootEl: HTMLElement,
  title: string | DocumentFragment,
  description: string | DocumentFragment | null,
): HTMLElement {
  const state = ensureContainerState(rootEl);
  const sectionEl = rootEl.createDiv({ cls: SETTING_SECTION_CLASS });
  const headingEl = sectionEl.createDiv({ cls: SETTING_SECTION_HEADING_CLASS });
  const titleEl = headingEl.createDiv({
    cls: SETTING_SECTION_HEADING_TITLE_CLASS,
  });

  if (typeof title === "string") {
    titleEl.setText(title);
  } else {
    titleEl.appendChild(title);
  }

  if (description) {
    const hasDescription =
      typeof description === "string" ? description.trim().length > 0 : true;

    if (hasDescription) {
      const descEl = headingEl.createDiv({
        cls: SETTING_SECTION_HEADING_DESCRIPTION_CLASS,
      });
      if (typeof description === "string") {
        descEl.setText(description);
      } else {
        descEl.appendChild(description);
      }
    }
  }

  const bodyEl = sectionEl.createDiv({ cls: SETTING_SECTION_BODY_CLASS });
  state.activeBodyEl = bodyEl;
  state.implicitSectionEl = null;
  return bodyEl;
}

export function getActiveSectionHeadingEl(
  rootEl: HTMLElement,
): HTMLElement | null {
  const state = getContainerState(rootEl);
  const bodyEl = state?.activeBodyEl;
  if (!bodyEl?.isConnected) {
    return null;
  }

  const sectionEl = bodyEl.parentElement;
  if (!sectionEl?.classList.contains(SETTING_SECTION_CLASS)) {
    return null;
  }

  return sectionEl.querySelector(
    ".setting-section-heading",
  ) as HTMLElement | null;
}

export function ensureSectionHeadingActionsEl(
  rootEl: HTMLElement,
): HTMLElement | null {
  const headingEl = getActiveSectionHeadingEl(rootEl);
  if (!headingEl) {
    return null;
  }

  headingEl.classList.add("setting-section-heading--with-actions");

  let actionsEl = headingEl.querySelector(
    `.${SETTING_SECTION_HEADING_ACTIONS_CLASS}`,
  ) as HTMLElement | null;

  if (!actionsEl) {
    actionsEl = headingEl.createDiv({
      cls: SETTING_SECTION_HEADING_ACTIONS_CLASS,
    });
  }

  return actionsEl;
}

function hasHeadingDescriptionContent(
  description: string | DocumentFragment,
): boolean {
  return typeof description === "string" ? description.trim().length > 0 : true;
}

export function setActiveSectionHeadingDescription(
  rootEl: HTMLElement,
  description: string | DocumentFragment,
): void {
  const headingEl = getActiveSectionHeadingEl(rootEl);
  if (!headingEl) {
    return;
  }

  let descEl = headingEl.querySelector(
    `.${SETTING_SECTION_HEADING_DESCRIPTION_CLASS}`,
  ) as HTMLElement | null;

  if (!hasHeadingDescriptionContent(description)) {
    descEl?.remove();
    return;
  }

  if (!descEl) {
    descEl = headingEl.createDiv({
      cls: SETTING_SECTION_HEADING_DESCRIPTION_CLASS,
    });
    const titleEl = headingEl.querySelector(
      `.${SETTING_SECTION_HEADING_TITLE_CLASS}`,
    );
    const actionsEl = headingEl.querySelector(
      `.${SETTING_SECTION_HEADING_ACTIONS_CLASS}`,
    );
    if (titleEl && actionsEl) {
      headingEl.insertBefore(descEl, actionsEl);
    } else if (titleEl) {
      titleEl.insertAdjacentElement("afterend", descEl);
    } else {
      headingEl.appendChild(descEl);
    }
  }

  descEl.empty();
  if (typeof description === "string") {
    descEl.setText(description);
  } else {
    descEl.appendChild(description);
  }
}

export function removeEmptyImplicitSection(rootEl: HTMLElement): void {
  const state = getContainerState(rootEl);
  if (!state?.implicitSectionEl?.isConnected || !state.activeBodyEl) {
    return;
  }

  if (state.activeBodyEl.childElementCount > 0) {
    return;
  }

  state.implicitSectionEl.remove();
  state.activeBodyEl = null;
  state.implicitSectionEl = null;
}
