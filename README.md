# N0xx RATP Bot
Installation et lancement 

```bash
docker build -t ThemeParkBot .
docker run -d --env BOT_TOKEN="your-token" --name ThemeParkBot -v /data/ThemeParkBot:/ThemeParkBot/data -v /etc/localtime:/etc/localtime:ro --restart=always ThemeParkBot 
```
