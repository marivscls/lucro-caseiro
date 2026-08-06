import { z } from "zod";

const positionalArgsSchema = z.tuple([z.string().email()]);

export function parseTestEmailArgs(args: string[]): { recipient: string } {
  if (!args.includes("--confirm")) {
    throw new Error("Confirme o envio adicionando --confirm");
  }

  const [recipient] = positionalArgsSchema.parse(
    args.filter((arg) => arg !== "--" && arg !== "--confirm"),
  );
  return { recipient };
}
