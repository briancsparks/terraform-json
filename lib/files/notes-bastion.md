
Stuff to install:

```shell script
sudo apt-get install -y conntrack
```

Stuff to run:

```shell script
sudo conntrack -E -n

sudo iptables -t nat -L -n -v
sudo tcpdump -i ens5 -s 1500 port not 22 and port not 8301 and port not 8300

ip route
ip route list
netstat -rn
route -n
```
