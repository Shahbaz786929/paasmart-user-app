import { apiRequest } from "./client";
import { API_ORIGIN } from "./config";

export type Address = {
  id: number;
  fullName: string;
  mobileNumber: string;
  houseNo: string;
  area: string;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  defaultAddress: boolean;
  latitude: number | null;
  longitude: number | null;
};

export type AddressPayload = {
  fullName: string;
  mobileNumber: string;
  houseNo: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  defaultAddress: boolean;
  latitude?: number;
  longitude?: number;
};

const ADDRESS_BASE = `${API_ORIGIN}/api`;

export function getAddresses(token: string): Promise<Address[]> {
  return apiRequest<Address[]>("/address", { token, baseUrl: ADDRESS_BASE });
}

export function addAddress(token: string, payload: AddressPayload): Promise<Address> {
  return apiRequest<Address>("/address", { method: "POST", token, baseUrl: ADDRESS_BASE, body: payload });
}

export function updateAddress(token: string, id: number, payload: AddressPayload): Promise<Address> {
  return apiRequest<Address>(`/address/${id}`, { method: "PUT", token, baseUrl: ADDRESS_BASE, body: payload });
}

export function deleteAddress(token: string, id: number): Promise<string> {
  return apiRequest<string>(`/address/${id}`, { method: "DELETE", token, baseUrl: ADDRESS_BASE });
}

export function setDefaultAddress(token: string, id: number): Promise<Address> {
  return apiRequest<Address>(`/address/default/${id}`, { method: "PUT", token, baseUrl: ADDRESS_BASE });
}