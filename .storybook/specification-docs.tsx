import React, {
  createContext,
  useContext,
  type ComponentProps,
  type PropsWithChildren,
} from "react";
import { MDXProvider } from "@mdx-js/react";
import {
  AnchorMdx,
  CodeOrSourceMdx,
  DocsContainer,
  DocsContext,
  HeaderMdx,
  HeadersMdx,
  Markdown,
  type DocsContainerProps,
} from "@storybook/addon-docs/blocks";
import { NAVIGATE_URL } from "storybook/internal/core-events";
import summary from "../spec/src/SUMMARY.md?raw";
import relocations from "../spec/relocations.json";
import {
  canonicalLink,
  docsHref,
  specificationChapters,
} from "../scripts/spec-validation/specification-navigation.mjs";
import "./specification-docs.css";

const chapters = specificationChapters(summary);
type Chapter = (typeof chapters)[number];
const ChapterContext = createContext<Chapter | undefined>(undefined);

function CanonicalLink(props: ComponentProps<"a">) {
  const chapter = useContext(ChapterContext);
  const context = useContext(DocsContext);
  // Source anchors are retained for mdBook; the heading owns them in Storybook.
  if (!props.href && /^ln-[a-z]+-\d{3}$/.test(props.id ?? "")) return null;
  const href =
    chapter && props.href
      ? canonicalLink(
          props.href,
          chapter,
          chapters,
          relocations,
          window.location.href,
        )
      : props.href;
  const url = href ? new URL(href, window.location.href) : undefined;
  const route = url?.searchParams.get("path");
  const internal =
    url?.origin === window.location.origin &&
    chapters.some(({ id }) => route === `/docs/${id}`);
  const linkProps = {
    ...props,
    href: href ?? "",
    target: props.target ?? (internal ? "_top" : "_self"),
    onClick(event: React.MouseEvent<HTMLAnchorElement>) {
      props.onClick?.(event);
      if (
        !internal ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        props.target === "_blank"
      )
        return;
      event.preventDefault();
      // Keep the top-level Storybook history authoritative. A preview-channel
      // navigation can replace the current entry in static Chromium builds,
      // which makes browser Back work but leaves no Forward entry. Push the
      // manager route directly, preserving its history index, then notify its
      // router so the preview reloads the selected Docs story.
      const parent = window.parent;
      if (
        parent !== window &&
        parent.location.origin === window.location.origin
      ) {
        const state = parent.history.state;
        const index =
          typeof state?.idx === "number" ? state.idx + 1 : undefined;
        parent.history.pushState(
          index === undefined ? state : { ...state, idx: index },
          "",
          `${url!.pathname}${url!.search}${url!.hash}`,
        );
        parent.dispatchEvent(new PopStateEvent("popstate"));
      } else {
        context.channel.emit(NAVIGATE_URL, `${route}${url!.hash}`, {
          plain: false,
        });
      }
    },
  };
  return <AnchorMdx {...linkProps} />;
}

function RequirementHeading(props: ComponentProps<"h2">) {
  const id = String(props.children)
    .match(/^(LN-[A-Z]+-\d{3})\b/)?.[1]
    ?.toLowerCase();
  return <HeaderMdx as="h2" {...props} id={id ?? props.id ?? ""} />;
}

function CanonicalMarkdown(props: ComponentProps<typeof Markdown>) {
  return (
    <Markdown
      {...props}
      options={{
        ...props.options,
        overrides: {
          code: CodeOrSourceMdx,
          ...HeadersMdx,
          a: CanonicalLink,
          h2: RequirementHeading,
        },
      }}
    />
  );
}
const components = { Markdown: CanonicalMarkdown };

export function SpecificationDocsContainer(
  props: PropsWithChildren<DocsContainerProps>,
) {
  const id = new URL(window.location.href).searchParams.get("id");
  const chapter = chapters.find((entry) => entry.id === id);
  if (!chapter) return <DocsContainer {...props} />;
  const index = chapters.indexOf(chapter);
  const previous = chapters[index - 1];
  const next = chapters[index + 1];
  return (
    <DocsContainer {...props}>
      <ChapterContext.Provider value={chapter}>
        <MDXProvider components={components}>
          <div
            className="specification-docs"
            data-specification-chapter={chapter.path}
          >
            <nav
              aria-label="Specification breadcrumbs"
              className="specification-breadcrumbs"
            >
              {chapter.path !== "index.md" ? (
                <>
                  <CanonicalLink
                    href={docsHref(chapters[0].id, "", window.location.href)}
                  >
                    Specification
                  </CanonicalLink>
                  <span aria-hidden="true">/</span>
                </>
              ) : null}
              {chapter.parents.map((parentId) => {
                const parent = chapters.find((entry) => entry.id === parentId)!;
                return (
                  <React.Fragment key={parent.id}>
                    <CanonicalLink
                      href={docsHref(parent.id, "", window.location.href)}
                    >
                      {parent.label}
                    </CanonicalLink>
                    <span aria-hidden="true">/</span>
                  </React.Fragment>
                );
              })}
              <span aria-current="page">{chapter.label}</span>
            </nav>
            {props.children}
            <nav
              aria-label="Specification reading order"
              className="specification-reading-order"
            >
              {previous ? (
                <CanonicalLink
                  href={docsHref(previous.id, "", window.location.href)}
                  rel="prev"
                >
                  Previous: {previous.label}
                </CanonicalLink>
              ) : (
                <span />
              )}
              {next ? (
                <CanonicalLink
                  href={docsHref(next.id, "", window.location.href)}
                  rel="next"
                >
                  Next: {next.label}
                </CanonicalLink>
              ) : null}
            </nav>
          </div>
        </MDXProvider>
      </ChapterContext.Provider>
    </DocsContainer>
  );
}
