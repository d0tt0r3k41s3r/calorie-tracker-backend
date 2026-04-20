import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import OpenAI from "openai";
import "dotenv/config";

const app = express();
const upload = multer ({dest: "uploads/"});

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: ProcessingInstruction.env.OPENAI_API_KEY
});

app.post("/analyze-food", upload.single("image"), async (req, res) => {
    try {
        const imageBuffer = fs.readFileSync(req.file.path);
        const description = req.body.description || "";

        const response = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
                {
                    role: "system",
                    content: `
                    Eres nutricionista deportivo.
                    Se conservador.
                    Asume comida cocinada.
                    Ten en cuenta aceites invisibles.
                    Devuelve SOLO JSON valido.
                    `
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `
                            Description: ${description}
                            devuelve exactamente:
                            {
                            "calories": number,
                            "protein": number,
                            "carbs": number,
                            "fat": number,
                            "confidence": "alta" | "media" | "baja"
                            }
                            `
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${imageBuffer.toString("base64")}`
                            }
                        }
                    ]
                }
            ]
        });
        
        fs.unlinkSync(req.file.path);
        res.json(JSON.parse(response.choices[0].message.content));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error procesando imagen"});
    }
});

app.listen(3001, () =>
console.log("Backend activo en puerto 3001")
);