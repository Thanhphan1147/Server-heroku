��h e r o k u - s e r v e r  

on heroku: https://multiplayer-server-001.herokuapp.com


To host locally you need to install node dependencies and open port 8080 in your firewall configuration (port can be changed in source code)

Download nodejs
windows: https://nodejs.org/en/download/
linux: apt-get install / yum install /....

install node dependencies
npm install

Open port 8080 for communication
on linux: IPTABLES -I 1 INPUT -p tcp --dport 8080 -j ACCEPT  or  IPTABLES -A INPUT -p tcp --dport 8080 -j ACCEPT
on windows: go to firewall settings on your computer and add a firewall rule (accept tcp connection on port 8080).

Hosting on the internet requires a static ip address and NAT port forwarding (if you are using a router).
 
