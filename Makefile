.PHONY: dev
dev:
	bun script/dev.ts
	
.PHONY: build
build:
	node script/build.js

.PHOHY: deploy
deploy: build
	bun x @cubing/deploy

.PHONY: clean
clean:
	rm -rf ./dist

.PHONY: setup
setup:
	bun install

.PHONY: lint
lint:
	bun x @biomejs/biome check ./script ./src
	
.PHONY: format
format:
	npx @biomejs/biome format --write ./script ./src
