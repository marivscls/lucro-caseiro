import type { FiadoLink, PixSettings, UpdatePixSettings } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { isFiadoToken, newFiadoToken, preparePixSettings } from "./fiado.domain";
import type { FiadoStatement, IFiadoRepo } from "./fiado.types";

const EMPTY_PIX: PixSettings = { pixKeyType: null, pixKey: null, pixCity: null };

export class FiadoUseCases {
  constructor(
    private repo: IFiadoRepo,
    private tokenFactory: () => string = newFiadoToken,
  ) {}

  async getPixSettings(userId: string): Promise<PixSettings> {
    return (await this.repo.getPixSettings(userId)) ?? EMPTY_PIX;
  }

  async updatePixSettings(userId: string, data: UpdatePixSettings): Promise<PixSettings> {
    const prepared = preparePixSettings(data);
    if (!prepared.ok) throw new ValidationError([prepared.error]);
    return this.repo.updatePixSettings(userId, prepared.value);
  }

  /** Um link por cliente: devolve o que já existe ou cria. */
  async getOrCreateLink(
    userId: string,
    clientId: string,
    brandId: string,
  ): Promise<FiadoLink> {
    if (!(await this.repo.clientExists(userId, clientId))) {
      throw new NotFoundError("Cliente não encontrado");
    }
    const existing = await this.repo.findLinkToken(userId, clientId);
    if (existing) return { token: existing, clientId };
    const token = await this.repo.insertLink(
      userId,
      clientId,
      this.tokenFactory(),
      brandId,
    );
    return { token, clientId };
  }

  async getPublicStatement(token: string): Promise<FiadoStatement> {
    if (!isFiadoToken(token)) throw new NotFoundError("Extrato não encontrado");
    const statement = await this.repo.findStatement(token);
    if (!statement) throw new NotFoundError("Extrato não encontrado");
    return statement;
  }
}
