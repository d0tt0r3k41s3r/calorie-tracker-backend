import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { TextGenerationModel } from "@google-ai/generative";
import "dotenv/config";

const app = express();
const upload = multer ({dest: "uploads/"});

app.use(cors());
app.use(express.json());

const gemini = new TextGenerationModel({
    apiKey: process.env.GOOGLE_API_KEY
});

app.post("/analyze-food", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No se recibió la imagen" });
        }

        const imageBuffer = fs.readFileSync(req.file.path);
        const description = req.body.description || "";
        const imageBase64 = imageBuffer.toString("base64");

        const prompt = `
Eres nutricionista deportivo.
Se conservador.
Asume comida cocinada.
Ten en cuenta aceites invisibles.
Devuelve SOLO JSON valido.

Description: ${description}
Imagen base64: ${imageBase64}

Devuelve exactamente:
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "confidence": "alta" | "media" | "baja"
}
`;

        const response = await gemini.generate({
            model: "gemini-1.5-mini",
            prompt
        });
        
        fs.unlinkSync(req.file.path);
        const text = response?.text || "";
        res.json(JSON.parse(text.trim()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Error procesando imagen"});
    }
});

app.listen(3001, () =>
console.log("Backend activo en puerto 3001")
);