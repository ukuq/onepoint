#!/bin/bash

PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

echo "+============================================================+"
echo "|                    OnePoint Netinstaller                   |"
echo "|                                                            |"
echo "|                                              <ukuq@qq.com> |"
echo "|------------------------------------------------------------|"
echo "|                                          https://onesrc.cn |"
echo "+============================================================+"
echo ""

echo -e "\n|  OnePoint is installing ... "

# deps
if [ -n "$(command -v apt-get)" ]
then
  apt-get install -y curl wget unzip
  curl -sL https://deb.nodesource.com/setup_12.x | bash - >/dev/null 2>&1
  apt-get install -y nodejs
elif [ -n "$(command -v yum)" ]
then
  yum install -y curl wget unzip
  curl --silent --location https://rpm.nodesource.com/setup_12.x | bash - >/dev/null 2>&1
  yum install -y nodejs
fi


echo -e "|\n|  Download OnePoint Package ... "
wget -O onepoint-master.zip https://github.com/ukuq/onepoint/archive/master.zip

unzip -q -o onepoint-master.zip -d ./

mkdir -p /www/wwwroot/
mv onepoint-master /www/wwwroot/onepoint
rm -f onepoint-master.zip

cd /www/wwwroot/onepoint
echo -e "|\n|  Install Dependents ... "
npm install
npm install pm2 -g

pm2 start /bin/index_node.js --name onepoint

if [ $? -eq 0 ]; then
    echo -e "|\n|  Success: OnePoint has been installed\n"
else
    echo "failed"
fi