# ComfyUI Prompt Journal

ComfyUI Prompt Journal is a personal utility for recording, reviewing and organizing ComfyUI generations.

The project sits somewhere between note taking, experiment tracking and dataset collection. Its purpose is to preserve
the context around a generation so that lessons learned from one prompt can be applied to future prompts.

## Overview

```text
Intent
  ↓
Generation
  ↓
Auto extraction of prompt and settings
  ↓
Human Review
  ↓
LLM cleaning and analysis
  ↓
Store
  ↓
(later)
  ↓
Analyze, fine-tune, search
```

The answers it aims to store are those that one would have to answer anyway when reviewing the output.

* What was the intent - human provided?
* Did it work?
* What is wrong - human review?
* Suggested corrections to prompt or settings

And by storing these it captures the iterative refinement context.

## Approach

A ComfyUI generated media file is imported via CLI commands.

The system extracts available metadata, resolves referenced input assets and creates a review package containing the
information required for evaluation.

The review package is then completed by a human reviewer. The human review is the primary artifact produced by the
system.

An LLM may optionally be used to clean, structure, summarize or tag the human-provided intent and review.

All that data is then imported.

Currently - semi-automatic workflow.

## Design Goals

The project is intentionally narrow in scope.

It is:

* ComfyUI specific
* optimized for personal use
* designed around iterative experimentation
* focused on preserving context
* focused on minimizing manual bookkeeping
* tailored for video creation process (opinionated hierarchy)

The goal is to make documenting a generation require little more than reviewing the result and recording observations
that would likely have been made anyway.

The intent being, structured note-taking, with substantial automation opportunity, and feed the data needs of future
refinements - manual or ML.

## Long-Term Direction

The current implementation functions as a structured prompt journal.

Over time, the accumulated generation history can serve as:

* a searchable prompt reference
* a prompt efficacy journal
* a model comparison dataset
* a retrieval source for future RAG systems
* a source of examples for multi-shot prompting
* a foundation for future prompt analysis and fine-tuning workflows
* a UI
* everything except manual reviews fully automated

The project does not currently attempt to optimize prompts automatically.

Its primary purpose is to capture experience in a structured form so that future systems can learn from it.


## Current State
- personal experiment
- manual LLM analysis - could be easily automated using local or cloud LLMs
- tests
  - shallow, validation tests only.
  - Aimed more towards checking for obvious errors. 
  - Fails auto-run due to lack of environment setup. fixtures are mostly auto-generated
  - To pass, one must need to manually reset the DB and environment and run tests one at a time
- Manual review required. But that is the goal anyway - to have a tool to note the efficacy of a generation
- CLI-based workflow
- Query and Viewing directly via DB and sql
