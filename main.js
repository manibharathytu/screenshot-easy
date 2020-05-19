const clipboardy = require('clipboardy');


var watch = require('node-watch');


var awsCli = require('aws-cli-js');
var Options = awsCli.Options;
var Aws = awsCli.Aws;

var options = new Options(
    /* accessKey    */ 
    /* secretKey    */ 
);

var aws = new Aws(options);

let lastTime = 0;
const oneSecondRuleCheck = function () { // The goal of this wait time is whenever a file is updaed its triggering 2 or 3 updates back to back. To prevent
  const curTime = Date.now()
  if (curTime - lastTime > 1000) { lastTime = curTime; return false; }
  else return true;
}


const onChangeDetection = function (evt, name) {

  if (evt == 'update' && !name.startsWith('Screenshot')) {
    console.log('%s %s', name, evt);
    if(oneSecondRuleCheck()) return;
    const fileName = name.split('/').pop()
    const upload_cmd = "s3 cp \"" + name + "\" s3://screenshots-auto --grants read=uri=http://acs.amazonaws.com/groups/global/AllUsers"
    clipboardy.writeSync('https://screenshots-auto.s3.us-west-2.amazonaws.com/' + fileName); // copy to clipboard

    aws.command(upload_cmd).then(function (data) {
      console.log('data = ', data);
    });

  }
}

watch('/home/mani/Downloads', { recursive: false }, onChangeDetection);
watch('/home/mani/Pictures', { recursive: false }, onChangeDetection);


  // ////
  // silly :

  // typeof(name)=='string' && 
