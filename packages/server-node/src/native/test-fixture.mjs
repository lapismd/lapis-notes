import { createServer } from "node:net";
const index = process.argv.indexOf("--socket");
const server = createServer((socket) => {
  let pending = "";
  socket.on("data", (bytes) => {
    pending += bytes.toString();
    const end = pending.indexOf("\n");
    if (end < 0) return;
    const request = JSON.parse(pending.slice(0, end));
    pending = pending.slice(end + 1);
    const { action } = request;
    if (action.operation === "exit") process.exit(7);
    if (action.operation === "hang") return;
    socket.write(
      JSON.stringify({
        version: 1,
        id: action.operation === "wrong-id" ? "wrong" : request.id,
        frame:
          action.frame ?? (action.method === "shutdown" ? "closed" : "ready"),
        error: null,
      }) + "\n",
    );
    if (action.method === "shutdown") socket.end();
  });
  socket.on("close", () => server.close());
});
server.listen(process.argv[index + 1]);
