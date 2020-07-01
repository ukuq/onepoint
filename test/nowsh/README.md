# This folder is a demo for now.sh deploy.

https://now.sh/

# if you want deploy onepoint on now.sh, you should do such things:

1. run `npm i -g now@16.7.3`, install the now.sh cli.
2. run `now login`, login your now.sh account.
3. copy this nowsh folder and change directory to nowsh.
4. edit the api/config.json file for yourself.
4. run `now`, deploy onepoint.

- In nowsh, onepoint is deploy via npm package not github, maybe it's not the latest but it's stable.
- In nowsh, the conepoint config file is api/config.json.
- In nowsh, we don't hava the permission to write file, the config.json is read-only.
- In nowsh, if you want to save your config, you need to change the config.json in you local host, and deploy it again.