# Screenshot source extraction and material backfill

For screenshot-material generation, use `scripts/screenshot-execution.mjs` with the same commands and arguments as `scripts/page-execution.mjs`. It delegates the existing generation, finalization and QA operations and adds extraction recording and automatic material backfill. Use the exact board and request ID, and follow `references/single-page-execution.md` for the existing execution workflow.

Read every actual screenshot and save its extracted content in a project-local Markdown file before recording the image-generation inputs. Preserve wording, numbers, units, qualifiers, reading order and genuine relationships. Use a Markdown pipe table for a simple matrix and an HTML table with explicit `rowspan`/`colspan` for merged cells. Keep the source's row/column associations and shared-value scope. Report unreadable content explicitly. Keep page-number markers and production instructions out of the extraction file.

Pass `--extracted-source <file>` with the usual `record --guide ... --prompt ... --verified` command. The file is frozen beside the actual prompt. Table-led extraction enables the existing table QA requirements. This uses the screenshot interpretation already needed for generation and adds no transcription approval.

After a generated candidate passes QA and is registered, `complete` automatically writes that same request's extracted Markdown into its decision-version material and refreshes the preview/editor. The previous inactive Markdown is archived in that request directory. Viewing extracted text in Preview keeps screenshots as the generation source. Selecting Edit Markdown switches to the editable text source under the board's existing material-selection behavior.

If extraction sync fails after candidate registration, preserve the candidate and retry `complete` with the same manifest and QA file. It resumes extraction without another image generation or candidate registration. Concurrent edits cause a conflict message and retain the immutable extraction for reconciliation. Do not overwrite modified material to resolve that conflict without checking it.
