const clipboardy = require('clipboardy');
var watch = require('node-watch');
var awsCli = require('aws-cli-js');
const fs = require('fs')

var Options = awsCli.Options;
var Aws = awsCli.Aws;

const log_folder = "logs"
/////////////////////////////////////////////////// Single instance check
var net = require('net');

var isPortInUse = function(port, callback) {
    var server = net.createServer(function(socket) {
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


isPortInUse(5858, function(portInUse) {
    if (portInUse) {
    console.log("An instance already running");
    process.exit()
    }
    else{
    console.log("App is running...");
  }

    // else{
    //   reservePort()
    // }
});
//////////////////////////////////////////////////// Single instance check
if (!fs.existsSync(log_folder)){
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
  if (curTime - lastTime > 1000) { lastTime = curTime; return false; }
  else return true;
}
logger('app debug 2')


const onChangeDetection = function (evt, name) {
  logger('onChangeDetection')

  if (evt == 'update' && !name.startsWith('Screenshot')) {
    logger(name+' '+ evt);
    if(oneSecondRuleCheck()) return;
    // console.log('after one second rule check')
    const fileName = name.split('/').pop()
    const upload_cmd = "s3 cp \"" + name + "\" s3://screenshots-auto --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers"
    clipboardy.writeSync('https://screenshots-auto.s3.us-west-2.amazonaws.com/' + fileName); // copy to clipboard

    aws.command(upload_cmd).then(function (data) {
      logger('data = '+ data);
    });

  }
}
logger('app debug 3')



  watch('/home/mani/Downloads', { recursive: false }, onChangeDetection);
  watch('/home/mani/Pictures', { recursive: false }, onChangeDetection);

logger('app debug 4')

// setInterval(function(){logger('aaaaaaaaaaa')},2000) // use this to restart app


