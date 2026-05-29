import type { Material } from "@lucro-caseiro/contracts";

import { NotFoundError, ValidationError } from "../../shared/errors";
import { paginationMeta } from "../../shared/helpers/paginate";
import { validateMaterial } from "./materials.domain";
import type {
  CreateMaterialData,
  FindAllMaterialsOpts,
  IMaterialsRepo,
  UpdateMaterialData,
} from "./materials.types";

export class MaterialsUseCases {
  constructor(private repo: IMaterialsRepo) {}

  async create(userId: string, data: CreateMaterialData): Promise<Material> {
    const errors = validateMaterial(data);
    if (errors.length > 0) throw new ValidationError(errors);
    return this.repo.create(userId, data);
  }

  async getById(userId: string, id: string): Promise<Material> {
    const material = await this.repo.findById(userId, id);
    if (!material) throw new NotFoundError("Insumo nao encontrado");
    return material;
  }

  async list(userId: string, opts: FindAllMaterialsOpts) {
    const { items, total } = await this.repo.findAll(userId, opts);
    return { items, ...paginationMeta(total, opts.page, opts.limit) };
  }

  async lowStock(userId: string): Promise<Material[]> {
    return this.repo.findLowStock(userId);
  }

  async update(userId: string, id: string, data: UpdateMaterialData): Promise<Material> {
    const existing = await this.repo.findById(userId, id);
    if (!existing) throw new NotFoundError("Insumo nao encontrado");

    const errors = validateMaterial(data, true);
    if (errors.length > 0) throw new ValidationError(errors);

    const updated = await this.repo.update(userId, id, data);
    if (!updated) throw new NotFoundError("Insumo nao encontrado");
    return updated;
  }

  async adjust(userId: string, id: string, delta: number): Promise<Material> {
    const updated = await this.repo.adjustStock(userId, id, delta);
    if (!updated) throw new NotFoundError("Insumo nao encontrado");
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete(userId, id);
    if (!deleted) throw new NotFoundError("Insumo nao encontrado");
  }
}
