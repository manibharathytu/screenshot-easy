#!/bin/bash

THIS_DIR=$(dirname "$0")
cd $THIS_DIR
action=$1
if [[ $action == "start" ]]
then
    exec ./start.sh
    echo "start"
elif [ $action == "stop" ]
then
    exec ./stop.sh
    echo "stop"
else
    echo "invalid argument"
fi
