const net = require('node:net');

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (connected) => {
      socket.destroy();
      resolve(connected);
    };

    socket.setTimeout(3000);
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.once('timeout', () => finish(false));
  });
}

async function waitForMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI must be set before waiting for MongoDB.');

  const address = new URL(uri);
  const host = address.hostname;
  const port = Number(address.port || 27017);
  console.log(`Waiting for MongoDB at ${host}:${port}...`);

  while (!(await canConnect(host, port))) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log('MongoDB is accepting connections.');
}

waitForMongo().catch((error) => {
  console.error('Failed while checking MongoDB readiness:', error);
  process.exitCode = 1;
});
