
SFTP_PATH = "towns.dreamhost.com:~/garron.net/app/old-dancehack.com/"
URL       = "https://garron.net/app/old-dancehack.com/"

.PHONY: deploy
deploy:
	rsync -avz \
		--exclude .DS_Store \
		--exclude .git \
		./ \
		${SFTP_PATH}
	echo "\nDone deploying. Go to ${URL}\n"

.PHONY: clean
clean:
	rm -rf ./dist
