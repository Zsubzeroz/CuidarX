import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import fs from "fs";
import path from "path";
import patientRouter from "../routes/patients.js";

const TEST_FILE = path.join(process.cwd(), "clinic_data.test.json");
const ORIGINAL_FILE = path.join(process.cwd(), "clinic_data.json");

const app = express();
app.use(express.json());
app.use("/api/patients", patientRouter);

beforeAll(() => {
  if (fs.existsSync(ORIGINAL_FILE)) {
    fs.copyFileSync(ORIGINAL_FILE, ORIGINAL_FILE + ".bak");
  }

  process.env.DATA_FILE = TEST_FILE;
  fs.writeFileSync(
    TEST_FILE,
    JSON.stringify({ patients: [] }, null, 2),
    "utf-8"
  );
});

afterAll(() => {
  if (fs.existsSync(TEST_FILE)) {
    fs.unlinkSync(TEST_FILE);
  }
  if (fs.existsSync(ORIGINAL_FILE + ".bak")) {
    fs.copyFileSync(ORIGINAL_FILE + ".bak", ORIGINAL_FILE);
    fs.unlinkSync(ORIGINAL_FILE + ".bak");
  }
  delete process.env.DATA_FILE;
});

const validPatient = {
  name: "Carlos Alberto",
  phone: "(11) 99999-8888",
  dob: "1985-03-15",
  gender: "Masculino",
};

describe("POST /api/patients - Create", () => {
  it("should create a patient with valid data", async () => {
    const res = await request(app)
      .post("/api/patients")
      .send(validPatient);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Carlos Alberto");
    expect(res.body.gender).toBe("Masculino");
    expect(res.body.isDiabetic).toBe(false);
    expect(res.body).toHaveProperty("createdAt");
  });

  it("should reject when name is missing", async () => {
    const res = await request(app)
      .post("/api/patients")
      .send({ phone: "(11) 99999-8888", dob: "1985-03-15", gender: "Masculino" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });

  it("should reject when phone is missing", async () => {
    const res = await request(app)
      .post("/api/patients")
      .send({ name: "Maria", dob: "1985-03-15", gender: "Feminino" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("phone");
  });

  it("should reject when dob is missing", async () => {
    const res = await request(app)
      .post("/api/patients")
      .send({ name: "Maria", phone: "(11) 99999-8888", gender: "Feminino" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("dob");
  });

  it("should reject when gender is missing", async () => {
    const res = await request(app)
      .post("/api/patients")
      .send({ name: "Maria", phone: "(11) 99999-8888", dob: "1985-03-15" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("gender");
  });

  it("should reject invalid name (too short)", async () => {
    const res = await request(app)
      .post("/api/patients")
      .send({ ...validPatient, name: "A" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });

  it("should reject invalid phone format", async () => {
    const res = await request(app)
      .post("/api/patients")
      .send({ ...validPatient, phone: "abc" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("phone");
  });

  it("should reject invalid date format", async () => {
    const res = await request(app)
      .post("/api/patients")
      .send({ ...validPatient, dob: "15-03-1985" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("dob");
  });

  it("should reject invalid gender", async () => {
    const res = await request(app)
      .post("/api/patients")
      .send({ ...validPatient, gender: "Invalido" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("gender");
  });

  it("should reject empty body", async () => {
    const res = await request(app)
      .post("/api/patients")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("name");
  });
});

describe("GET /api/patients - List", () => {
  it("should return an empty list initially", async () => {
    const res = await request(app).get("/api/patients");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should return all created patients", async () => {
    await request(app).post("/api/patients").send(validPatient);
    await request(app)
      .post("/api/patients")
      .send({ ...validPatient, name: "Fernanda Silva", gender: "Feminino" });

    const res = await request(app).get("/api/patients");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});

describe("GET /api/patients/:id - Show", () => {
  it("should return a patient by id", async () => {
    const createRes = await request(app)
      .post("/api/patients")
      .send(validPatient);

    const res = await request(app).get(`/api/patients/${createRes.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createRes.body.id);
    expect(res.body.name).toBe(validPatient.name);
  });

  it("should return 404 for non-existent id", async () => {
    const res = await request(app).get("/api/patients/non-existent-id");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Patient not found");
  });
});

describe("PUT /api/patients/:id - Update", () => {
  it("should update a patient successfully", async () => {
    const createRes = await request(app)
      .post("/api/patients")
      .send(validPatient);

    const res = await request(app)
      .put(`/api/patients/${createRes.body.id}`)
      .send({ name: "Carlos Alberto Updated", isDiabetic: true });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Carlos Alberto Updated");
    expect(res.body.isDiabetic).toBe(true);
    expect(res.body.id).toBe(createRes.body.id);
  });

  it("should return 404 when updating non-existent patient", async () => {
    const res = await request(app)
      .put("/api/patients/non-existent-id")
      .send({ name: "Test" });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Patient not found");
  });

  it("should reject invalid fields on update", async () => {
    const createRes = await request(app)
      .post("/api/patients")
      .send(validPatient);

    const res = await request(app)
      .put(`/api/patients/${createRes.body.id}`)
      .send({ phone: "invalid" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("phone");
  });
});

describe("DELETE /api/patients/:id - Destroy", () => {
  it("should delete a patient successfully", async () => {
    const createRes = await request(app)
      .post("/api/patients")
      .send(validPatient);

    const res = await request(app).delete(
      `/api/patients/${createRes.body.id}`
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const getRes = await request(app).get(
      `/api/patients/${createRes.body.id}`
    );
    expect(getRes.status).toBe(404);
  });

  it("should return 404 when deleting non-existent patient", async () => {
    const res = await request(app).delete("/api/patients/non-existent-id");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Patient not found");
  });
});
