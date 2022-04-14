import fetch from 'node-fetch';
import express from 'express';
import cors from 'cors'
import bodyParser from 'body-parser'

let cur = 0;
const servers = ["https://rpc-juno.itastakers.com", "https://rpc-juno.nodes.guru"];
let serverTracking = {}


for (var s of servers) {
    let serverTrack = { latency: -1, averageLatency: -1, startTime: -1, errorCount: 0 }
    serverTracking[s] = serverTrack;
}

const handler = async (req, res) => {

    console.log(req.url)
    if (req.url == "/servertracking" || req.url == "/favicon.ico") {
        res.send(serverTracking)
        return;
    } else {

        console.log({ cur })

        if (cur + 1 >= servers.length) {
            cur = 0;
        } else {
            cur++;
        }

        let curServer = servers[cur];
        serverTracking[curServer].startTime = Date.now();

        let data;
        try {
            let response = await fetch(curServer + req.url, {
                "body": req.body,
                "method": req.method
            });

            data = await response.json()
            serverTracking[curServer].latency = (Date.now() - serverTracking[curServer].startTime)

        } catch (err) {

            try {
                console.log("RPC Error:")
                console.log(err)

                let response = await fetch(servers[0] + req.url, {
                    "body": req.body,
                    "method": req.method
                });

                data = await response.json()

                serverTracking[curServer].errorCount++
            } catch (err2) {
                console.log("Caught final error: ")
                res.send({ error: "server error" })
            }
        }

        res.send(data)
    }
};

const info = async (req, res) => {
    res.send(serverTracking)
}

const server = express()

server.use(cors())
server.use(express.urlencoded({ extended: true }));
server.use(bodyParser.text({ type: "*/*" }));

server.get('*', handler).post('*', handler);

server.get('/info', info)

const port = process.env.PORT || 9100;
server.listen(port, () =>
    console.log('RPC Aggregator listening on port: ' + port),
);