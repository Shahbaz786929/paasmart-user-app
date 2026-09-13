import { Platform } from "react-native";
import { apiRequest } from "./client";

export type Profile = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  referralCode: string;
  walletBalance: number;
  profileImage: string | null;
  createdAt: string;
};

export type UpdateProfilePayload = {
  name: string;
  email?: string | null;
};

export function getMyProfile(token: string): Promise<Profile> {
  return apiRequest<Profile>("/users/me", { token });
}

export function updateMyProfile(token: string, payload: UpdateProfilePayload): Promise<Profile> {
  return apiRequest<Profile>("/users/me", { method: "PUT", token, body: payload });
}



export async function updateProfilePhoto(token: string, imageUri: string): Promise<Profile> {
  const form = new FormData();
  const filename = imageUri.split("/").pop()?.split("?")[0] || "photo.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  if (Platform.OS === "web") {
    // Web par browser ka FormData asli Blob/File maangta hai — {uri,name,type}
    // object nahi chalta. Pehle blob URI ko fetch karke real Blob banate hain.
    const blob = await (await fetch(imageUri)).blob();
    form.append("image", blob, filename);
  } else {
    // Native (Android/iOS) — RN ka FormData polyfill is object shape ko samajhta hai
    form.append("image", { uri: imageUri, name: filename, type } as any);
  }

  const { API_ORIGIN } = await import("./config");
  const response = await fetch(`${API_ORIGIN}/api/v1/users/me/photo`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  const text = await response.text();
  let parsed: any = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // raw text
  }

  if (!response.ok) {
    const message = (parsed && (parsed.message || parsed.error)) || "Could not update profile photo.";
    throw new Error(message);
  }

  return parsed as Profile;
}