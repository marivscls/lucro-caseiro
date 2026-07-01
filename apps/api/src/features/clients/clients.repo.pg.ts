import type { Client } from "@lucro-caseiro/contracts";
import { clients } from "@lucro-caseiro/database/schema";
import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import type { AppDatabase } from "../../shared/db";
import type { CreateClientData, FindAllOpts, IClientsRepo } from "./clients.types";

function normalizedPhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return digits.slice(2);
  }
  return digits;
}

function normalizedPhoneSql(phoneColumn: typeof clients.phone) {
  const digits = sql<string>`regexp_replace(coalesce(${phoneColumn}, ''), '\\D', '', 'g')`;
  return sql<string>`case
    when length(${digits}) in (12, 13) and left(${digits}, 2) = '55'
    then substring(${digits} from 3)
    else ${digits}
  end`;
}

export class ClientsRepoPg implements IClientsRepo {
  constructor(private db: AppDatabase) {}

  async create(userId: string, data: CreateClientData): Promise<Client> {
    const [row] = await this.db
      .insert(clients)
      .values({
        userId,
        name: data.name,
        phone: data.phone ?? null,
        address: data.address ?? null,
        birthday: data.birthday ?? null,
        notes: data.notes ?? null,
        tags: data.tags ?? [],
      })
      .returning();

    return this.toClient(row!);
  }

  async findById(userId: string, id: string): Promise<Client | null> {
    const [row] = await this.db
      .select()
      .from(clients)
      .where(and(eq(clients.userId, userId), eq(clients.id, id)));

    return row ? this.toClient(row) : null;
  }

  async findDuplicateByPhone(
    userId: string,
    phone: string,
    excludeId?: string,
  ): Promise<Client | null> {
    const digits = normalizedPhoneDigits(phone);
    if (!digits) return null;

    const conditions = [
      eq(clients.userId, userId),
      sql`${normalizedPhoneSql(clients.phone)} = ${digits}`,
    ];
    if (excludeId) conditions.push(sql`${clients.id} <> ${excludeId}`);

    const [row] = await this.db
      .select()
      .from(clients)
      .where(and(...conditions))
      .limit(1);

    return row ? this.toClient(row) : null;
  }

  async findAll(
    userId: string,
    opts: FindAllOpts,
  ): Promise<{ items: Client[]; total: number }> {
    const conditions = [eq(clients.userId, userId)];

    if (opts.search) {
      const searchDigits = opts.search.replace(/\D/g, "");
      const searchConditions = [
        ilike(clients.name, `%${opts.search}%`),
        ilike(clients.phone, `%${opts.search}%`),
      ];
      if (searchDigits) {
        const searchDigitsPattern = `%${searchDigits}%`;
        searchConditions.push(
          sql`regexp_replace(coalesce(${clients.phone}, ''), '\\D', '', 'g') like ${searchDigitsPattern}`,
        );
      }

      conditions.push(or(...searchConditions)!);
    }

    const where = and(...conditions);
    const offset = (opts.page - 1) * opts.limit;

    const [rows, [countResult]] = await Promise.all([
      this.db
        .select()
        .from(clients)
        .where(where)
        .limit(opts.limit)
        .offset(offset)
        .orderBy(sql`${clients.createdAt} DESC`),
      this.db.select({ value: count() }).from(clients).where(where),
    ]);

    return {
      items: rows.map((r) => this.toClient(r)),
      total: countResult?.value ?? 0,
    };
  }

  async update(
    userId: string,
    id: string,
    data: Partial<CreateClientData>,
  ): Promise<Client | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.birthday !== undefined) updateData.birthday = data.birthday;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.tags !== undefined) updateData.tags = data.tags;

    if (Object.keys(updateData).length === 0) {
      return this.findById(userId, id);
    }

    const [row] = await this.db
      .update(clients)
      .set(updateData)
      .where(and(eq(clients.userId, userId), eq(clients.id, id)))
      .returning();

    return row ? this.toClient(row) : null;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const [row] = await this.db
      .delete(clients)
      .where(and(eq(clients.userId, userId), eq(clients.id, id)))
      .returning({ id: clients.id });

    return !!row;
  }

  async countByUser(userId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: count() })
      .from(clients)
      .where(eq(clients.userId, userId));

    return result?.value ?? 0;
  }

  async findBirthdaysInMonth(userId: string, month: number): Promise<Client[]> {
    const rows = await this.db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.userId, userId),
          sql`EXTRACT(MONTH FROM ${clients.birthday}::date) = ${month}`,
        ),
      )
      .orderBy(sql`EXTRACT(DAY FROM ${clients.birthday}::date) ASC`);

    return rows.map((r) => this.toClient(r));
  }

  private toClient(row: typeof clients.$inferSelect): Client {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      phone: row.phone,
      address: row.address,
      birthday: row.birthday,
      notes: row.notes,
      tags: row.tags,
      totalSpent: Number(row.totalSpent),
      createdAt: row.createdAt.toISOString(),
    };
  }
}
