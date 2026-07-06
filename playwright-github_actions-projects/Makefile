INPUT ?= ../projects_selection.json
REPOS ?= ../repositories
OUTPUT ?= ./output
LANGS ?= nodejs java
WORKERS ?= 4

.PHONY: run skip-clone sample static

run:
	python3 -B main.py --input $(INPUT) --repos-dir $(REPOS) --output-dir $(OUTPUT) \
		--languages $(LANGS) --workers $(WORKERS)

skip-clone:
	python3 -B main.py --input $(INPUT) --repos-dir $(REPOS) --output-dir $(OUTPUT) \
		--languages $(LANGS) --workers $(WORKERS) --skip-clone

# Small sanity run (first N repos), static detection only (no API).
sample:
	python3 -B main.py --input $(INPUT) --repos-dir $(REPOS) --output-dir $(OUTPUT) \
		--languages $(LANGS) --workers $(WORKERS) --max-repos 20 --no-api

# Full static run without API verification.
static:
	python3 -B main.py --input $(INPUT) --repos-dir $(REPOS) --output-dir $(OUTPUT) \
		--languages $(LANGS) --workers $(WORKERS) --no-api
