const clients = new Set();

function sendEvent(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch (e) {
      // swallow
    }
  }
}

function addClient(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');
  clients.add(res);
  res.on('close', () => clients.delete(res));
}

module.exports = { addClient, sendEvent };
