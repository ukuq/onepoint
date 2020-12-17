#/bin/bash

echo "+============================================================+"
echo "|                    OnePoint Netinstaller                   |"
echo "|                                                            |"
echo "|                                              <ukuq@qq.com> |"
echo "|------------------------------------------------------------|"
echo "|                                          https://onesrc.cn |"
echo "+============================================================+"
echo ""

echo -e "OnePoint is installing ... "

VERSION=v12.16.1
if [ $(uname -m) = aarch64 ];then
  pkg upgrade -y
  pkg install nodejs-lts -y
  npm install pm2 -g --registry  https://registry.npm.taobao.org/
else
  DISTRO=linux-x64
  echo -e "Install nodejs VERSION=$VERSION DISTRO=$DISTRO"
  sudo mkdir -p /usr/local/lib/nodejs
  #wget https://nodejs.org/dist/$VERSION/node-$VERSION-$DISTRO.tar.xz
  wget https://npm.taobao.org/mirrors/node/$VERSION/node-$VERSION-$DISTRO.tar.xz
  sudo tar -xJvf node-$VERSION-$DISTRO.tar.xz -C /usr/local/lib/nodejs 
  sudo ln -sf /usr/local/lib/nodejs/node-$VERSION-$DISTRO/bin/node  /usr/local/bin/
  sudo ln -sf /usr/local/lib/nodejs/node-$VERSION-$DISTRO/bin/npm  /usr/local/bin/
  npm install pm2 -g --registry  https://registry.npm.taobao.org/
  sudo ln -sf /usr/local/lib/nodejs/node-$VERSION-$DISTRO/bin/pm2  /usr/local/bin/
fi
node --version
npm --version
if [ $? -ne 0 ];then 
  exit $? 
fi

echo -e "Fast Install ... "
mkdir onepoint
cd onepoint
npm install onepoint --registry  https://registry.npm.taobao.org/
echo -e "config.json:"`pwd`/node_modules/onepoint/config.json
pm2 start ./node_modules/onepoint/bin/index_node.js --name onepoint
if [ $? -ne 0 ];then 
  echo "pm2 start failed, try running without pm2"
  node ./node_modules/onepoint/bin/index_node.js
fi