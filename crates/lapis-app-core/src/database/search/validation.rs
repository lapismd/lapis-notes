use crate::database::invalid;
use crate::services::Result;
use lapis_app_protocol::database::search::records::SearchDocumentRecord;

pub(super) fn record(record: &SearchDocumentRecord) -> Result<()> {
    let mut numbers = vec![];
    for chunk in record.chunks.iter().flatten() {
        numbers.extend([chunk.start_offset, chunk.end_offset]);
        if let Some(e) = &chunk.embedding {
            numbers.extend(e.dimensions);
            numbers.extend(e.updated_at);
            numbers.extend(e.vector.iter().flatten().copied());
        }
    }
    if let Some(s) = &record.source_metadata {
        numbers.extend(s.source_mtime);
        numbers.extend(s.source_size);
        numbers.extend(s.frontmatter_end_offset);
        numbers.extend([
            s.chunking.target_chars,
            s.chunking.breakpoint_window_chars,
            s.chunking.breakpoint_decay,
        ]);
        for heading in &s.headings {
            numbers.extend([
                heading.level,
                heading.position.start.offset,
                heading.position.end.offset,
            ]);
        }
        for section in &s.sections {
            numbers.extend([section.position.start.offset, section.position.end.offset]);
        }
    }
    if numbers.iter().all(|v| v.is_finite()) {
        Ok(())
    } else {
        Err(invalid("Invalid Search numeric data"))
    }
}
