import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { Patient } from "../types.js";

const router = Router();
const DATA_FILE = process.env.DATA_FILE || path.join(process.cwd(), "clinic_data.json");

function readDb(): { patients: Patient[] } {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return { patients: [] };
  }
}

function writeDb(data: { patients: Patient[] }): void {
  const full = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  full.patients = data.patients;
  fs.writeFileSync(DATA_FILE, JSON.stringify(full, null, 2), "utf-8");
}

const requiredFields = ["name", "phone", "gender", "dob"] as const;

function validate(body: any, partial = false): string | null {
  if (!body || typeof body !== "object") return "Body must be a JSON object";
  if (!partial) {
    for (const field of requiredFields) {
      if (!body[field] || (typeof body[field] === "string" && body[field].trim() === "")) {
        return `Field '${field}' is required`;
      }
    }
  }
  if (body.name !== undefined && (typeof body.name !== "string" || body.name.trim().length < 2)) {
    return "Field 'name' must be a string with at least 2 characters";
  }
  if (body.phone !== undefined && !/^[\d\s()+-]{8,}$/.test(body.phone)) {
    return "Field 'phone' must be a valid phone number";
  }
  if (body.dob !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(body.dob)) {
    return "Field 'dob' must be a valid date in YYYY-MM-DD format";
  }
  if (body.gender !== undefined && !["Masculino", "Feminino", "Outro"].includes(body.gender)) {
    return "Field 'gender' must be 'Masculino', 'Feminino', or 'Outro'";
  }
  return null;
}

router.get("/", (_req: Request, res: Response) => {
  const db = readDb();
  res.json(db.patients);
});

router.get("/:id", (req: Request, res: Response) => {
  const db = readDb();
  const patient = db.patients.find((p) => p.id === req.params.id);
  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }
  res.json(patient);
});

router.post("/", (req: Request, res: Response) => {
  const error = validate(req.body);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const db = readDb();
  const patient: Patient = {
    id: `pat-${Date.now()}`,
    name: req.body.name.trim(),
    phone: req.body.phone.trim(),
    dob: req.body.dob,
    gender: req.body.gender,
    isDiabetic: req.body.isDiabetic ?? false,
    hasCirculatoryIssues: req.body.hasCirculatoryIssues ?? false,
    isSmoker: req.body.isSmoker ?? false,
    hasAllergies: req.body.hasAllergies ?? "Não",
    observations: req.body.observations ?? "",
    footIssues: req.body.footIssues ?? [],
    evolutions: req.body.evolutions ?? [],
    createdAt: new Date().toISOString(),
  };

  db.patients.push(patient);
  writeDb(db);
  res.status(201).json(patient);
});

router.put("/:id", (req: Request, res: Response) => {
  const db = readDb();
  const index = db.patients.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  const error = validate(req.body, true);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  const existing = db.patients[index];
  const updated: Patient = {
    ...existing,
    ...req.body,
    id: existing.id,
    createdAt: existing.createdAt,
  };

  db.patients[index] = updated;
  writeDb(db);
  res.json(updated);
});

router.delete("/:id", (req: Request, res: Response) => {
  const db = readDb();
  const index = db.patients.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  db.patients.splice(index, 1);
  writeDb(db);
  res.json({ success: true });
});

export default router;
