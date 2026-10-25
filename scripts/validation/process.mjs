import { spawn } from "node:child_process";
export function execute(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    const stop = (signal) => child.kill(signal);
    const interrupt = () => stop("SIGINT"),
      terminate = () => stop("SIGTERM");
    process.on("SIGINT", interrupt);
    process.on("SIGTERM", terminate);
    child.once("error", finish);
    child.once("exit", (code, signal) =>
      finish(code === 0 ? null : Error(`${command} exited ${code ?? signal}`)),
    );
    function finish(error) {
      process.off("SIGINT", interrupt);
      process.off("SIGTERM", terminate);
      if (error) reject(error);
      else resolve();
    }
  });
}
