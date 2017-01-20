FROM node
MAINTAINER n0xx
RUN apt-get update
RUN export LC_ALL='en_US.utf8'
COPY bin/ /ThemeParkBot
WORKDIR /ThemeParkBot
RUN npm install
CMD ["node", "index.js"]
