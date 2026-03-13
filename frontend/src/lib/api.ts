import apiClient from "./apiClient";
// Add this to your existing @/lib/api.ts

export const firebaseLogin = async (data: {
  idToken: string;
  role: string;
  name?: string;
  phone?: string;
}) => {
  const res = await apiClient.post("/auth/firebase", data);
  return res.data;
};

export const login = async (phone: string, role: string, name: string) => {
  const res = await apiClient.post("/auth/login", {
    phone,
    role,
    name,
  });

  return res.data;
};
// Update your existing createBatch function in @/lib/api.ts:

export const createBatch = async (data: {
  crop: string;
  quantity: number;
  location: string;
  harvestDate: string;
  sellingPricePerKg?: number;
  totalSellingPrice?: number;
}) => {
  const res = await apiClient.post("/batch", data);
  return res.data;
};

export const getMyBatches = async () => {
  const res = await apiClient.get("/batch/my");
  return res.data;
};


export const getBatchByCode = async (batchCode: string) => {
  const res = await apiClient.get(`/batch/${batchCode}`);
  return res.data;
};

export const getBatchActions = async (batchCode: string) => {
  const res = await apiClient.get(`/batch/${batchCode}/actions`);
  return res.data;
};

export const logMiddlemanAction = async (
  batchCode: string,
  data: {
    actionType: string;
    location?: string;
    price?: number;
    notes?: string;
  }
) => {
  const res = await apiClient.post(`/batch/${batchCode}/action`, data);
  return res.data;
};

export const getMyActions = async () => {
  const res = await apiClient.get("/batch/middleman/my-actions");
  return res.data;
};
