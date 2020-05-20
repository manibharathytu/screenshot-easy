####### Helpers
timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

log() {
    echo $(timestamp) - $1
}

####### My main logic starts
log "start.sh starts..."

THIS_DIR=$(dirname "$0")
cd $THIS_DIR

log "$THIS_DIR/start.log . Check this file for further logs"

{
    log "Going to execute node app"
    node main.js
    log "start.sh execution ends. This means node app has exited for some resaon. Refer app.log for more info."
} >>start.log
