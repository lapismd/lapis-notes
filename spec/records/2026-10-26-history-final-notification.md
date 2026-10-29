# Final backup publication notification

This bounded Notes source repair starts at Desktop's qualified Notes cohort
`0b05c990`. Its native History worker still discards a closed Tokio watch sender,
which can hide the final checkpoint notification during successful backup pause.
The separate committed jj-store reader repair remains an independent consumer pin.

Exact regressions, authored before changing the worker:

```sh
pnpm rust:core -- test -p lapis-app-core --lib services::backup::history::tests --locked -- --nocapture
```

Two notification cases retain the real worker, its existing source-error retry,
and real Tokio watch semantics. Both sender closure with an unseen final value
and closure without a new value must wake exactly once before periodic repair.
No test invokes an index step or schedules work on behalf of the worker.
Native source/build/strict/specification qualification and actual Desktop
saved-checkpoint acceptance remain separate gates.

Baseline `8bcc4e68-f0cc-49b3-8558-bebbc512b659`, snapshot `ab419a5b`,
compiles successfully: the unchanged self-drop case passes and both new closure
cases fail (one pass/two failures). Each timeout precedes the worker's existing
five-second source-error retry, so periodic repair cannot satisfy the assertion.
The new worker treats closed sender state as one final reconciliation request
and retires that receiver; it does not take a capture lease or change query code.

The exact after run `faafa6cb-f8f6-4bce-82a4-757d0d40ed9e`, snapshot
`0c271081`, passes all three cases. Full qualification
`3544b756-7c72-42b1-b6f1-edc9a5c038c1`, immutable snapshot
`d9e5195e057fade8fc5adcc63ef666df4b421b1f`, passes the exact three, all 14
affected backup cases, all 382 Rust workspace cases (zero failures, six existing
environment ignores), locked native build, boundary/protocol/fmt/strict Clippy,
ten specification lanes and all 78 governance regressions.

This changes only the private worker and its two notification regressions;
public APIs, npm inputs, native dependency pins, host defaults and renderer code
are unchanged from the qualified Desktop cohort. Product/input bytes remain
identical to the full snapshot after this evidence/tracker closure. Source
qualification does not replace Desktop's separate actual saved-checkpoint rerun
or admit unrelated newer Notes algorithms into that fixed consumer cohort.
