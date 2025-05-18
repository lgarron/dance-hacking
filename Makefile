.PHONY: dev
dev: setup
	bun script/dev.ts

.PHONY: setup
setup:
	bun install --frozen-lockfile

.PHONY: build
build: setup
	node script/build.js

.PHOHY: deploy
deploy: build
	bun x @cubing/deploy

.PHONY: clean
clean:
	rm -rf ./dist

.PHONY: lint
lint: setup
	bun x @biomejs/biome check ./script ./src
	
.PHONY: format
format: setup
	npx @biomejs/biome format --write ./script ./src
