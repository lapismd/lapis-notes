//! Explicit one-file transformations using the admitted vault's existing writer.
mod error;
mod persistence;
#[cfg(test)]
mod tests;

use super::Work;
pub use error::{TaskWriteError, TaskWriteResult};
use lapis_app_protocol::{ExpectedVersion, TextSnapshot};
use lapis_task_services::{
    TaskMutation, TaskOccurrenceCompletion, TaskOccurrenceMaterialization,
    TaskOccurrenceObservation,
};

impl Work {
    pub fn mutate_task(
        &self,
        path: &str,
        expected: &ExpectedVersion,
        mutation: &TaskMutation,
    ) -> TaskWriteResult<TextSnapshot> {
        persistence::apply(self, path, expected, |raw| {
            lapis_task_services::apply_task_mutation(raw, path, mutation)
        })
    }

    pub fn materialize_task_occurrence(
        &self,
        path: &str,
        expected: &ExpectedVersion,
        input: &TaskOccurrenceMaterialization,
    ) -> TaskWriteResult<TextSnapshot> {
        persistence::apply(self, path, expected, |raw| {
            lapis_task_services::materialize_task_occurrence(raw, path, input)
        })
    }

    pub fn complete_task_occurrence(
        &self,
        path: &str,
        expected: &ExpectedVersion,
        observation: &TaskOccurrenceObservation,
        completion: &TaskOccurrenceCompletion,
    ) -> TaskWriteResult<TextSnapshot> {
        persistence::apply(self, path, expected, |raw| {
            lapis_task_services::complete_task_occurrence(raw, path, observation, completion)
        })
    }
}
