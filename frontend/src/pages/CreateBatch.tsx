import React, { useState } from "react";
import { createBatch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const CreateBatch = () => {
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [timestamp, setTimestamp] = useState(Date.now());
  const {user } = useAuth();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createBatch({
        crop:product,
        quantity: Number(quantity),
        location,
        harvestDate,
      });

      alert("Batch created successfully!");

      setProduct("");
      setQuantity("");
      setLocation("");
      setHarvestDate("");
      setTimestamp(Date.now());
    } catch (err) {
      console.error(err);
      alert("Failed to create batch");
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">Create New Batch</h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          type="text"
          placeholder="Product Name"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="text"
          placeholder="Farm Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="date"
          value={harvestDate}
          onChange={(e) => setHarvestDate(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />
      
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Create Batch
        </button>

      </form>
    </div>
  );
};

export default CreateBatch;