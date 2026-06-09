import { describe, expect, it, vi } from "vitest";

import { ServiceUnavailableError } from "../../shared/errors";
import { AccountUseCases } from "./account.usecases";
import type { IAccountRepo, IAuthAdmin } from "./account.types";

const USER_ID = "user-123";

function makeSut(
  repoOverrides: Partial<IAccountRepo> = {},
  authOverrides: Partial<IAuthAdmin> = {},
) {
  const repo: IAccountRepo = {
    deleteUser: vi.fn(() => Promise.resolve()),
    ...repoOverrides,
  };
  const authAdmin: IAuthAdmin = {
    deleteAuthUser: vi.fn(() => Promise.resolve()),
    ...authOverrides,
  };
  const sut = new AccountUseCases(repo, authAdmin);
  return { sut, repo, authAdmin };
}

describe("AccountUseCases.deleteAccount", () => {
  it("remove o usuario do Auth e depois apaga os dados (cascade)", async () => {
    // Arrange
    const { sut, repo, authAdmin } = makeSut();

    // Act
    await sut.deleteAccount(USER_ID);

    // Assert
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authAdmin.deleteAuthUser).toHaveBeenCalledWith(USER_ID);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repo.deleteUser).toHaveBeenCalledWith(USER_ID);
  });

  it("apaga o Auth ANTES dos dados", async () => {
    // Arrange
    const order: string[] = [];
    const { sut } = makeSut(
      { deleteUser: vi.fn(() => (order.push("data"), Promise.resolve())) },
      { deleteAuthUser: vi.fn(() => (order.push("auth"), Promise.resolve())) },
    );

    // Act
    await sut.deleteAccount(USER_ID);

    // Assert
    expect(order).toEqual(["auth", "data"]);
  });

  it("NAO apaga os dados se a exclusao no Auth falhar", async () => {
    // Arrange
    const { sut, repo } = makeSut(
      {},
      {
        deleteAuthUser: vi.fn(() =>
          Promise.reject(new ServiceUnavailableError("Auth admin indisponível")),
        ),
      },
    );

    // Act + Assert
    await expect(sut.deleteAccount(USER_ID)).rejects.toBeInstanceOf(
      ServiceUnavailableError,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repo.deleteUser).not.toHaveBeenCalled();
  });
});
