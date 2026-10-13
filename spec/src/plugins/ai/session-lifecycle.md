# AI Plugin / Session lifecycle

## LN-AI-021 — Chat messages: use Design Core MessageMetadata. Assistant messages MUST

<a id="ln-ai-021"></a>

**Requirement.** Chat messages MUST use Design Core `MessageMetadata`. Assistant messages MUST expose a Copy response action that copies the raw response text. Items MUST store an ISO `createdAt`, and restored sessions MUST keep those timestamps.

## LN-AI-065 — While a submitted turn remains active, the: show an accessible working indicator immediately above

<a id="ln-ai-065"></a>

**Requirement.** While a submitted turn remains active, the chat panel MUST show an accessible working indicator immediately above the composer and remove it when the turn completes, fails, or is cancelled.
