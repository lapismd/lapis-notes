# Third-Party Notices

## MemPalace sweep semantics

The AI memory ingestion implementation adapts the deterministic per-message
identity and crash-resume boundary semantics from `mempalace/sweeper.py` at
MemPalace commit `4c1e6d0c1150e2a0134ad9d085cf952f77f64aa1`. Lapis rewrites the
implementation in TypeScript against its own transcript, vault, and AppDatabase
contracts and does not include MemPalace, Chroma, or a Python runtime.

MemPalace is licensed under the MIT License:

> Copyright (c) 2026 MemPalace Contributors
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

Source: <https://github.com/mempalace/mempalace/tree/4c1e6d0c1150e2a0134ad9d085cf952f77f64aa1>
