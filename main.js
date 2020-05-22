const clipboardy = require('clipboardy');
var watch = require('node-watch');
var awsCli = require('aws-cli-js');
const fs = require('fs')
const notifier = require('node-notifier');

var Options = awsCli.Options;
var Aws = awsCli.Aws;

const log_folder = "logs"
/////////////////////////////////////////////////// Single instance check
var net = require('net');

var isPortInUse = function (port, callback) {
  var server = net.createServer(function (socket) {
    socket.write('Echo server\r\n');
    socket.pipe(socket);
  });

  server.listen(port, '127.0.0.1');
  server.on('error', function (e) {
    callback(true);
  });
  server.on('listening', function (e) {
    // server.close();
    callback(false);
  });
};


isPortInUse(5858, function (portInUse) {
  if (portInUse) {
    console.log("An instance already running");
    process.exit()
  }
  else {
    console.log("App is running...");
  }

  // else{
  //   reservePort()
  // }
});
//////////////////////////////////////////////////// Single instance check
if (!fs.existsSync(log_folder)) {
  fs.mkdirSync(log_folder);
}

const logger = function (txt) {

  const timestamp = new Date().toISOString();
  const data = timestamp + ' : ' + txt + '\n'

  fs.appendFile('logs/app.log', data, function (err) {
    if (err) throw err;
  });
}
logger('app debug 1')

const aws_creds = fs.readFileSync('/home/mani/.aws/credentials').toString()

const aws_access_key_id = aws_creds.match(new RegExp('aws_access_key_id = ' + "(.*)" + '\n'))[1]
const aws_secret_access_key = aws_creds.match(new RegExp('aws_secret_access_key = ' + "(.*)" + '\n'))[1]

var options = new Options(
  aws_access_key_id,
  aws_secret_access_key,
);

var aws = new Aws(options);

let lastTime = 0;
const oneSecondRuleCheck = function () { // The goal of this wait time is whenever a file is updaed its triggering 2 or 3 updates back to back. To prevent
  const curTime = Date.now()
  if (curTime - lastTime > 1000) { lastTime = curTime;return false; }
  else { lastTime = curTime;return true; }
}
logger('app debug 2')

const upload = function(filePath){
  const fileName = filePath.split('/').pop()
  // console.log('after one second rule check')
  const upload_cmd = "s3 cp \"" + filePath + "\" s3://screenshots-auto --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers"
  clipboardy.writeSync('https://screenshots-auto.s3.us-west-2.amazonaws.com/' + fileName); // copy to clipboard
  logger("copied to clipboard")
  notifier.notify('copied to clipboard');

  aws.command(upload_cmd).then(function (data) {
    logger('data = ' + data);
  notifier.notify('upload done');

  });
}
let queue = {}
const onChangeDetection = function (evt, filePath) {
  logger('onChangeDetection')
  const fileName = filePath.split('/').pop()
  logger(filePath + ' ' + evt);

  if (evt == 'update' && fileName.startsWith('Screencast')) { 
    const curTime = Date.now();
    queue[filePath] = curTime;
  }
// This way is faster. So using this for frequently used screenshot. Otherwise the Screencast way can handle this too.
 else if (evt == 'update' && fileName.startsWith('Screenshot')) { 
  if (oneSecondRuleCheck()) { logger('returning'); return; }
  upload(filePath)
}

}

const unqueue = function(){
  const curTime = Date.now()
  for (key in queue){
    lastTime = queue[key]
    if(curTime - lastTime > 5000){
      delete queue[key]
      upload(key)
    }
  }
}

setInterval(unqueue, 1000)
//todo : clearInterval and setInterval dynamically as queued and unqueued. This is running all the time is unnecessary

logger('app debug 3')


//todo: the delay should do all the work instead of my setInterva, queue, oneSecondRule etc.
watch('/home/mani/Downloads', { recursive: false, delay:100  }, onChangeDetection); // For browser extension lightning
watch('/home/mani/Pictures', { recursive: false, delay:100  }, onChangeDetection); // for gnome screenshot, window shot, screensnip
watch('/home/mani/Videos', { recursive: false, delay:500 }, onChangeDetection); // for gnome screencast

logger('app debug 4')

// setInterval(function(){logger('aaaaaaaaaaa')},2000) // use this to restart app.


