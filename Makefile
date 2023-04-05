.PHONY: dev
dev:
	bun script/dev.ts
	
.PHONY: build
build:
	node script/build.js

DEPLOY_SITE_PATH   = garron.net/app/dance-hacker/
DEPLOY_SOURCE_PATH = "./dist/${DEPLOY_SITE_PATH}"
DEPLOY_SFTP_PATH   = "towns.dreamhost.com:~/${DEPLOY_SITE_PATH}"

.PHONY: deploy
deploy: build
	rsync -avz \
		--exclude .DS_Store \
		--exclude .git \
		${DEPLOY_SOURCE_PATH} \
		${DEPLOY_SFTP_PATH}
	echo "\nDone deploying. Go to https://${DEPLOY_SITE_PATH}\n"

.PHONY: clean
clean:
	rm -rf ./dist
