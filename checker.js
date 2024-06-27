// Made by Courvix Network for the Courvix Network

const phin = require('phin')
const chalk = require('chalk')
const net = require('net')

const config = require("./config.json");
const ovh = require('ovh')({
    ...config.ovh
});

const serverName = config.serverName;

const ipBlock = config.serverIP;
const ipAddr = config.serverIP;
const interval = config.checkInterval * 1000;

let mitigationEnabled = false;

if (!net.isIPv4(ipAddr)) {
    console.log(chalk.magenta("Usage: node checker"));
} else {
    CheckMitigation();
}

async function CheckMitigation() {
    setInterval(() => {
        let time = new Date();
        console.log(chalk.white.bold(`[info] : Checking mitigation status ${time.toLocaleTimeString()}`));
        ovh.request("GET", `/ip/${encodeURIComponent(ipBlock)}/mitigation/${ipAddr}`, (err, mitigationStatus) => {
            if(!err) {
                console.log(chalk.green(`IP Address: ${ipAddr} | Auto Mode: ${mitigationStatus.auto} | Permanent Mode: ${mitigationStatus.permanent}`));
                if (mitigationStatus.permanent === true && mitigationStatus.auto === true) {
                    if (mitigationEnabled === true) {
                        console.log(chalk.blackBright.red("[warn] : Mitigation mode is still enabled"));
                    } else if (mitigationEnabled === false) {
                        console.log(chalk.blackBright.red("[warn] : Mitigation mode has been enabled"));
                        mitigationEnabled = true;
                        SendAlert(true);
                    }
                } else if (mitigationStatus.auto === false && mitigationEnabled === true) {
                    console.log(chalk.green("[info] : Mitigation mode has been disabled"));
                    mitigationEnabled = false;
                    SendAlert(false);
                }
            } else {
                console.log(chalk.blackBright.red(`[crit] : ${err} response (${mitigationStatus})`));
            }
        });
    }, interval);
}

async function SendAlert(mode) {
    let description;
    let footer;
    let color;
    
    if (mode === true) {
        description = "A possible DDoS attack has been detected";
        footer = "Our system is attempting to mitigate the attack and traffic is being re-routed for scrubbing."
        color = 16056320;
    } else if (mode === false) {
        description = "Mitigation mode has been disabled on the IP";
        footer = "End of attack on IP address.";
        color = 65338;
    }
    
    const webhookPayload = {
        "embeds": [{
            "title": "DDoS Attack",
            "description": description,
            "url": "",
            "color": color,
            "fields": [{
                "name": "Server:",
                "value": serverName,
                "inline": true
            },
                {
                    "name": "IP Address:",
                    "value": ipAddr,
                    "inline": true
                },
                {
                    "name": "Host:",
                    "value": "OVH",
                    "inline": true
                },
                {
                    "name": "Protection Provider:",
                    "value": "OVH VAC",
                    "inline": true
                },
            ],
            "author": {
                "name": "GREENHELL DAYZ",
                "url": "",
                "icon_url": "https://i.imgur.com/skw3wjv.png"
            },
            "footer": {
                "text": footer,
                "icon_url": "https://img.pngio.com/warning-icon-png-321332-free-icons-library-warning-icon-png-2400_2400.jpg"
            },
            "thumbnail": {
                "url": "https://i.imgur.com/k7rVMPE.png"
            }
        }]
    }
    const request = phin.defaults({
        'method': 'POST',
        'parse': 'json',
        'data': webhookPayload
    })

    const res = await request(config.webhookURL);
    return(res);
}
