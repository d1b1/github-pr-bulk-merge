var GitHubApi = require("github");
var _ = require('underscore');
var util = require( "util" );
var prompt = require('prompt');
var cmd = require('node-cmd');
var async = require('async');
var argv = require('minimist')(process.argv.slice(2));

delete argv._;
if (_.isEmpty(argv)) {
    // Make sure we have the minimum and if not show the usage.
    return console.log("node index.js -u 'd1b1' -p 'password' -r 'd1b1/myRepo'");
}

if (!argv.u) {
    return console.log('Missing the github username.');
}

if (!argv.p) {
    return console.log('Missing the github password.');
}

if (!argv.p) {
    return console.log('Missing the github milestone.');
}

if (!argv.r) {
    return console.log('Missing the github repo.');
}

if (argv.r.split('/').length !=2) {
    return console.log('Missing the github repo must be user/repoName.');
}

var github = new GitHubApi({
    version: '3.0.0',
    debug: false
});

console.log('sss', argv);
github.authenticate({
    type: 'basic',
    username: argv.u,
    password: argv.p
});

github.pullRequests.getAll({
    user: argv.r.split('/')[0],
    repo: argv.r.split('/')[1],
    milestone: argv.m
}, function(err, prData) {

    console.log('dddd', err);

    console.log(util.format("There are %d in the milestone.", prData.length));

    var numOfPrs = prData.length;
    var currentPrIdx = 0;
    prompt.start();

    var property = {
        name: 'yesno',
        description: 'Continue? (y/n)',
        validator: /y[es]*|n[o]?/,
        warning: 'Must respond yes or no',
        default: 'yes'
    };

    _.each(prData, function(pr) {
        currentPrIdx++;
        pr.idx = currentPrIdx;
    });

    var q = async.queue(function (pr, callback) {
        cmd.get(
            'git merge --no-ff origin/' + pr.head.ref,
            function(git){
                console.log(git);
                property.description = property.message = pr.idx + '/' + numOfPrs + ' Continue? (y/n)';
                prompt.get(property, function(err, result) {
                    if(result.yesno === 'no' || result.yesno === 'n'){
                        console.log('Stopping the PR merges!');
                        process.exit(0);
                    } else {
                        callback();
                    }
                });
            }
        );
    }, 1);

    q.drain = function() {
       console.log('All Done.');
    }

    q.push(prData);
});