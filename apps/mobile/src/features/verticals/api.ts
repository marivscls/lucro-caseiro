import type {
  AppMembership,
  CreateResaleSerial,
  CreateVerticalAsset,
  CreateVerticalDocument,
  ResaleSerial,
  VerticalAsset,
  VerticalDashboard,
  VerticalDocument,
  VerticalDocumentKind,
} from "@lucro-caseiro/contracts";

import { apiClient } from "../../shared/utils/api-client";

const BASE = "/api/v1/verticals";

export function touchVerticalMembership(token: string) {
  return apiClient<AppMembership>(`${BASE}/membership`, { method: "POST", token });
}

export function fetchVerticalMemberships(token: string) {
  return apiClient<AppMembership[]>(`${BASE}/memberships`, { token });
}

export function fetchVerticalDashboard(token: string) {
  return apiClient<VerticalDashboard>(`${BASE}/dashboard`, { token });
}

export function fetchVerticalDocuments(token: string, kind?: VerticalDocumentKind) {
  const query = kind ? `?kind=${encodeURIComponent(kind)}` : "";
  return apiClient<VerticalDocument[]>(`${BASE}/documents${query}`, { token });
}

export function createVerticalDocument(token: string, data: CreateVerticalDocument) {
  return apiClient<VerticalDocument>(`${BASE}/documents`, {
    method: "POST",
    token,
    body: data,
  });
}

export function transitionVerticalDocument(
  token: string,
  input: { id: string; status: string; idempotencyKey: string },
) {
  return apiClient<VerticalDocument>(`${BASE}/documents/${input.id}/transition`, {
    method: "POST",
    token,
    body: {
      status: input.status,
      idempotencyKey: input.idempotencyKey,
      payload: {},
    },
  });
}

export function fetchVerticalAssets(token: string) {
  return apiClient<VerticalAsset[]>(`${BASE}/assets`, { token });
}

export function createVerticalAsset(token: string, data: CreateVerticalAsset) {
  return apiClient<VerticalAsset>(`${BASE}/assets`, {
    method: "POST",
    token,
    body: data,
  });
}

export function fetchResaleSerials(token: string) {
  return apiClient<ResaleSerial[]>(`${BASE}/serials`, { token });
}

export function createResaleSerial(token: string, data: CreateResaleSerial) {
  return apiClient<ResaleSerial>(`${BASE}/serials`, {
    method: "POST",
    token,
    body: data,
  });
}

export function updateResaleSerialStatus(
  token: string,
  input: {
    id: string;
    expectedStatus: ResaleSerial["status"];
    status: ResaleSerial["status"];
  },
) {
  return apiClient<ResaleSerial>(`${BASE}/serials/${input.id}/status`, {
    method: "PATCH",
    token,
    body: input,
  });
}
