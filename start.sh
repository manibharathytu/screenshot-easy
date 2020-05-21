#!/bin/bash
####### Helpers
timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

log() {
    echo $(timestamp) - $1
}

####### My main logic starts

THIS_DIR=$(dirname "$0")
cd $THIS_DIR

log "Refer startup log - $THIS_DIR/start.log for any startup issues."

{
    log "Starting..."
    node main.js   #if not spawned the startup script will be stuck.  
    log "Exiting..."
    exit 0
} &>>start.log
