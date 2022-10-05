import { ChildProcess, spawn, SpawnOptions } from "child_process";

const whiteSpace = /\s+/;

interface IExecOptions extends SpawnOptions {
  printCommand?: boolean;
  trimOutput?: boolean;
  onStderrData?: (buffer: Buffer) => void;
  onStdoutData?: (buffer: Buffer) => void;
  onProc?: (
    process: ChildProcess,
    command: string,
    options: IExecOptions
  ) => void;
}

interface IBareResult {
  command: string;
  args: string[];
  stdout: Buffer[];
  stderr: Buffer[];
  code: number | null;
  signal: NodeJS.Signals | null;
  trimOutput: boolean;
}

const buffersToString = (buffers: Buffer[], trim: boolean) => {
  const str = Buffer.concat(buffers).toString();
  return trim ? str.trim() : str;
};

const getResult = ({
  stdout,
  stderr,
  command,
  args,
  trimOutput,
  ...bareResult
}: IBareResult) => ({
  ...bareResult,
  command: `${command} ${args.join(" ")}`,
  stdout: buffersToString(stdout, trimOutput),
  stderr: buffersToString(stderr, trimOutput),
});

const getError = (bareResult: IBareResult) =>
  new Error(
    `Process exited with code ${bareResult.code}\n\n${getResult(bareResult)}`
  );

export const exec = (
  command: string,
  options: IExecOptions = {}
): Promise<unknown> => {
  const {
    env = process.env,
    cwd = process.cwd(),
    stdio = "pipe",
    shell = true,
    trimOutput = true,
    printCommand = false,
    onStdoutData = () => {},
    onStderrData = () => {},
    onProc = () => {},
    ...other
  } = options;

  command = command.trim();
  const args: string[] = [];

  if (printCommand) {
    console.log(">", command);
  }

  const hasArgs = command.match(whiteSpace);
  if (hasArgs !== null && hasArgs.index) {
    args.push(command.substring(hasArgs.index).trim());
    command = command.substring(0, hasArgs.index);
  }

  return new Promise((resolve, reject) => {
    const spawnOptions = {
      env,
      cwd,
      stdio,
      shell,
      ...other,
    };

    const proc = spawn(command, args, spawnOptions);

    if (typeof onProc === "function") {
      onProc(proc, [command, ...args].join(" "), {
        trimOutput,
        printCommand,
        onStdoutData,
        onStderrData,
        onProc,
        ...spawnOptions,
      });
    }

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    if (proc.stdout) {
      proc.stdout.on("data", (buffer: Buffer) => {
        stdout.push(buffer);
        onStdoutData(buffer);
      });
    }
    if (proc.stderr) {
      proc.stderr.on("data", (buffer: Buffer) => {
        stderr.push(buffer);
        onStderrData(buffer);
      });
    }
    proc
      .on("error", (err) => stderr.push(Buffer.from(err.toString())))
      .on("close", (code, signal) => {
        const bareResult: IBareResult = {
          command,
          args,
          stdout,
          stderr,
          code,
          signal,
          trimOutput,
        };
        if (code === 0) {
          resolve(getResult(bareResult));
        } else {
          reject(getError(bareResult));
        }
      });
  });
};
