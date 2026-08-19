<script lang="ts">
  import { Badge } from "@lapismd/design-core/shadcn/badge";
  import { Button } from "@lapismd/design-core/shadcn/button";
  import type {
    UserInputAnswers,
    UserInputQuestion,
    UserInputRequest,
  } from "../core/types";

  let {
    request,
    disabled = false,
    onRespond,
  }: {
    request: UserInputRequest;
    disabled?: boolean;
    onRespond(answers: UserInputAnswers): void;
  } = $props();

  let answers = $state<Record<string, string>>({});
  let otherSelected = $state<Record<string, boolean>>({});
  const complete = $derived(
    request.questions.every((question) =>
      Boolean(answers[question.id]?.trim()),
    ),
  );

  function answer(question: UserInputQuestion, value: string): void {
    answers = { ...answers, [question.id]: value };
    otherSelected = { ...otherSelected, [question.id]: false };
  }

  function chooseOther(question: UserInputQuestion): void {
    answers = { ...answers, [question.id]: "" };
    otherSelected = { ...otherSelected, [question.id]: true };
  }

  function updateInput(question: UserInputQuestion, value: string): void {
    answers = { ...answers, [question.id]: value };
  }

  function submit(): void {
    if (disabled || !complete) return;
    onRespond(
      Object.fromEntries(
        request.questions.map((question) => [
          question.id,
          [answers[question.id]?.trim() ?? ""],
        ]),
      ),
    );
  }
</script>

<form
  class="ai-agent-request"
  data-ui-component="ai-agent-request"
  data-kind="question"
  data-testid="ai-question-card"
  onsubmit={(event) => {
    event.preventDefault();
    submit();
  }}
>
  {#each request.questions as question (question.id)}
    <fieldset>
      <legend>{question.header}</legend>
      <strong>{question.prompt}</strong>
      {#if question.options?.length}
        <div data-ui-part="options">
          {#each question.options as option, index (option.id)}
            <button
              type="button"
              data-ui-part="feedback-option"
              data-selected={!otherSelected[question.id] &&
                answers[question.id] === option.label}
              disabled={disabled}
              onclick={() => answer(question, option.label)}
            >
              <Badge
                variant={!otherSelected[question.id] &&
                answers[question.id] === option.label
                  ? "default"
                  : "secondary"}
                >{String.fromCharCode(65 + index)}</Badge
              >
              <span>
                <span>{option.label}</span>
                {#if option.description}
                  <small>{option.description}</small>
                {/if}
              </span>
            </button>
          {/each}
          {#if question.allowOther}
            <button
              type="button"
              data-ui-part="feedback-option"
              data-selected={otherSelected[question.id] === true}
              disabled={disabled}
              onclick={() => chooseOther(question)}
            >
              <Badge
                variant={otherSelected[question.id]
                  ? "default"
                  : "secondary"}
                >{String.fromCharCode(65 + question.options.length)}</Badge
              >
              <span>Other</span>
            </button>
          {/if}
        </div>
      {/if}
      {#if !question.options?.length || otherSelected[question.id]}
        <input
          type={question.secret ? "password" : "text"}
          aria-label={`${question.header} answer`}
          autocomplete="off"
          value={answers[question.id] ?? ""}
          disabled={disabled}
          oninput={(event) =>
            updateInput(question, event.currentTarget.value)}
        />
      {/if}
    </fieldset>
  {/each}
  <div data-ui-part="request-actions">
    <Button type="submit" size="sm" disabled={disabled || !complete}
      >Submit answer</Button
    >
  </div>
</form>
